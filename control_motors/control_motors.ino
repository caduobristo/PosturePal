#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

// Pinos motores
const int IN1 = 25;
const int IN2 = 26;
const int IN3 = 27;
const int IN4 = 14;
const int ENA = 4;
const int ENB = 5;

// PWM
const int freq = 20000;
const int channelA = 0;
const int channelB = 1;
const int resolution = 8;

// Encoder rotativo
const int CLK = 32;
const int DT  = 33;

volatile int pulseCount = 0;
unsigned long lastTime = 0;
float rpm = 0.0;

// Interrupção: detecta bordas de subida no CLK
void IRAM_ATTR encoderISR() {
  pulseCount++;
}

void setup() {
  Serial.begin(115200);
  SerialBT.begin("PosturePal");
  Serial.println("Bluetooth iniciado!");

  // Motores
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  ledcSetup(channelA, freq, resolution);
  ledcSetup(channelB, freq, resolution);
  ledcAttachPin(ENA, channelA);
  ledcAttachPin(ENB, channelB);

  // Encoder
  pinMode(CLK, INPUT_PULLUP);
  pinMode(DT, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(CLK), encoderISR, RISING);

  off();
}

unsigned long moveDuration = 5000;

// parâmetros físicos
const float PULSOS_POR_ROTACAO = 3800.0;
const float DIAMETRO_RODA_CM = 6.5;
const float CIRCUNFERENCIA_CM = 3.1416 * DIAMETRO_RODA_CM;

// tempo máximo sem movimento antes de parar
const unsigned long TEMPO_PARADA_MS = 1000;

bool andando = false;
unsigned long startMoveTime = 0;
unsigned long ultimaVelocidadeAtiva = 0;

void loop() {
  // Verifica comandos Bluetooth
  if (SerialBT.available()) {
    String comando = SerialBT.readStringUntil('\n');
    comando.trim();
    comando.toLowerCase();

    Serial.print("Comando recebido: ");
    Serial.println(comando);

    if (comando == "frente") iniciarFrente();
    else if (comando == "re") iniciarRe();
    else if (comando == "off") off();
  }

  // Se estiver andando, verifica se passou o tempo de movimento
  if (andando && millis() - startMoveTime >= moveDuration) {
    off();
  }

  // Medição da velocidade a cada 1 segundo
  unsigned long now = millis();
  if (now - lastTime >= 1000) {
    lastTime = now;

    int pulses = pulseCount;
    pulseCount = 0;

    // calcula RPM e velocidade linear
    rpm = (float)pulses / PULSOS_POR_ROTACAO * 60.0;
    float rps = rpm / 60.0;
    float vel_cm_s = rps * CIRCUNFERENCIA_CM;

    // envia pelo serial e bluetooth
    String msg = "Pulsos: " + String(pulses) +
                 " | RPM: " + String(rpm, 1) +
                 " | Velocidade: " + String(vel_cm_s, 1) + " cm/s";
    Serial.println(msg);
    SerialBT.println(msg);

    // verifica se deve parar
    if (andando) {
      if (vel_cm_s > 2.0) {
        ultimaVelocidadeAtiva = millis(); // está se movendo
      } else if (millis() - ultimaVelocidadeAtiva > TEMPO_PARADA_MS) {
        Serial.println("Velocidade zero detectada, parando motores!");
        SerialBT.println("parou");
        off();
      }
    }
  }
}

void iniciarFrente() {
  Serial.println("Movendo para frente");
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  ledcWrite(channelA, 255);
  ledcWrite(channelB, 255);
  andando = true;
  startMoveTime = millis();
}

void iniciarRe() {
  Serial.println("Ré");
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  ledcWrite(channelA, 255);
  ledcWrite(channelB, 255);
  andando = true;
  startMoveTime = millis();
}

void off() {
  if (andando) {
    andando = false;
    SerialBT.println("parou");
  }
  Serial.println("Motores parados");
  ledcWrite(channelA, 0);
  ledcWrite(channelB, 0);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}
