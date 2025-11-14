#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

// Pinos dos motores
const int IN1 = 25, IN2 = 26, IN3 = 27, IN4 = 14;
const int ENA = 4, ENB = 5;

// PWM
const int freq = 20000, channelA = 0, channelB = 1, resolution = 8;

// Encoder
const int CLK = 32;
volatile int pulseCount = 0;
unsigned long lastTime = 0;

volatile bool STATE_TIMER_ON = false;
volatile unsigned char STATE_PWM_PERC = 255;
volatile unsigned int STATE_MOVE_DURATION = 12000;

// Sensores IR
const int IR_LEFT_DO = 34;
const int IR_RIGHT_DO = 35;
const bool IR_ACTIVE_LOW = true;
const uint8_t IR_HITS_TO_STOP = 2;
uint8_t irHitsLeft = 0, irHitsRight = 0;

// Estado de direção e movimento
bool indoFrente = true;
bool andando = false;
unsigned long startMoveTime = 0;

// Parâmetros físicos
const float PULSOS_POR_ROTACAO = 3800.0;
const float DIAMETRO_RODA_CM = 6.5;
const float CIRCUNFERENCIA_CM = 3.1416 * DIAMETRO_RODA_CM;
const unsigned long TEMPO_PARADA_MS = 1000;
const uint8_t MIN_SAMPLES_BEFORE_STOP = 1;
const float VEL_MIN_CM_S = 2.0;

// Controle de velocidade
unsigned long ultimaVelocidadeAtiva = 0;
uint8_t samplesSinceStart = 0, zeroSamples = 0;

// Interrupção do encoder
void IRAM_ATTR encoderISR() { pulseCount++; }

void setup() {
  Serial.begin(115200);
  SerialBT.begin("PosturePal");
  Serial.println("Bluetooth iniciado!");

  pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT);
  ledcSetup(channelA, freq, resolution);
  ledcSetup(channelB, freq, resolution);
  ledcAttachPin(ENA, channelA);
  ledcAttachPin(ENB, channelB);

  pinMode(IR_LEFT_DO, INPUT);
  pinMode(IR_RIGHT_DO, INPUT);

  pinMode(CLK, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(CLK), encoderISR, RISING);

  frear();
}

void tratar_misc_comando(String cmd) {
  // 'x' + n = atualizar o valor do PWM ('x' + porcentagem de 0-255, com 255=1, 0=1)
  // 'y' + n = atualizar tempo do move duration ('y' + tempo em segundos)
  // 'z' = toggle dot state timer
  if(cmd[0] == 'x') {
    STATE_PWM_PERC = cmd[1];
  } else if(cmd[0] == 'y') {
    STATE_MOVE_DURATION = cmd[1] * 1000;
  } else if(cmd[0] == 'z') {
    STATE_TIMER_ON = !STATE_TIMER_ON;
  }
}

void loop() {
  // Comandos Bluetooth
  if (SerialBT.available()) {
    String comando = SerialBT.readStringUntil('\n');
    comando.trim();
    comando.toLowerCase();

    Serial.print("Comando recebido: ");
    Serial.println(comando);

    if (comando == "frente") {
      if (indoFrente) iniciarFrente();
      else iniciarRe();
      indoFrente = !indoFrente;
    } 
    else if (comando == "frear") {
      frear();
    } else {
      tratar_misc_comando(comando);
    }
  }

  if(STATE_TIMER_ON && andando && (millis() - startMoveTime) >= STATE_MOVE_DURATION){
    frear();
  }
  if(andando) {
    ledcWrite(channelA, STATE_PWM_PERC); ledcWrite(channelB, STATE_PWM_PERC);
  }

  // Verificação de sensores IR
  if (andando) {
    int l = digitalRead(IR_LEFT_DO);
    int r = digitalRead(IR_RIGHT_DO);
    bool leftTrig  = IR_ACTIVE_LOW ? (l == LOW)  : (l == HIGH);
    bool rightTrig = IR_ACTIVE_LOW ? (r == LOW)  : (r == HIGH);

    if (leftTrig && ++irHitsLeft >= IR_HITS_TO_STOP) {
      SerialBT.println("parou_left");
      frear();
      irHitsLeft = irHitsRight = 0;
    } else if (!leftTrig) irHitsLeft = 0;

    if (andando && rightTrig && ++irHitsRight >= IR_HITS_TO_STOP) {
      SerialBT.println("parou_right");
      frear();
      irHitsLeft = irHitsRight = 0;
    } else if (!rightTrig) irHitsRight = 0;
  }

  // Medição de velocidade
  unsigned long now = millis();
  if (now - lastTime >= 1000) {
    lastTime = now;
    noInterrupts();
    int pulses = pulseCount;
    pulseCount = 0;
    interrupts();

    float rpm = (float)pulses / PULSOS_POR_ROTACAO * 60.0;
    float rps = rpm / 60.0;
    float vel_cm_s = rps * CIRCUNFERENCIA_CM;

    if (andando) {
      samplesSinceStart++;
      if (samplesSinceStart <= MIN_SAMPLES_BEFORE_STOP) {
        if (vel_cm_s > VEL_MIN_CM_S) ultimaVelocidadeAtiva = millis();
        zeroSamples = 0;
      } else {
        if (vel_cm_s > VEL_MIN_CM_S) {
          ultimaVelocidadeAtiva = millis();
          zeroSamples = 0;
        } else if (++zeroSamples >= 2 &&
                   (millis() - ultimaVelocidadeAtiva > TEMPO_PARADA_MS)) {
          SerialBT.println("parou");
          frear();
        }
      }
    }
  }
}

void iniciarFrente() {
  Serial.println("Movendo para frente");
  digitalWrite(IN1, LOW);  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  ledcWrite(channelA, STATE_PWM_PERC); ledcWrite(channelB, STATE_PWM_PERC);

  andando = true;
  irHitsLeft = irHitsRight = 0;
  startMoveTime = millis();
  samplesSinceStart = 0;
  zeroSamples = 0;
  ultimaVelocidadeAtiva = millis();

  delay(1000);
}

void iniciarRe() {
  Serial.println("Movendo para trás");
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);  digitalWrite(IN4, HIGH);
  ledcWrite(channelA, STATE_PWM_PERC); ledcWrite(channelB, STATE_PWM_PERC);

  andando = true;
  irHitsLeft = irHitsRight = 0;
  startMoveTime = millis();
  samplesSinceStart = 0;
  zeroSamples = 0;
  ultimaVelocidadeAtiva = millis();

  delay(1000);
}

void frear() {
  if (andando) {
    andando = false;
    SerialBT.println("parou");
  }
  Serial.println("Freio ativo!");
  ledcWrite(channelA, 0);
  ledcWrite(channelB, 0);
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, HIGH);
}
