const int IN1 = 25;
const int IN2 = 26;
const int IN3 = 27;
const int IN4 = 14;

const int ENA = 4;
const int ENB = 5;

const int channelA = 0;
const int channelB = 1;
const int freq = 1000;
const int resolution = 8;

const int sensorHall = 12;  // detecta ímã como HIGH

bool motoresLigados = false;
int ultimoEstadoSensor = LOW;

unsigned long lastTrigger = 0;
const unsigned long debounceMs = 300;

void setup() {
  Serial.begin(115200);
  while (!Serial) {}

  Serial.println("Envie '1' para ligar os motores.");

  // Direções
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // PWM
  ledcSetup(channelA, freq, resolution);
  ledcSetup(channelB, freq, resolution);
  ledcAttachPin(ENA, channelA);
  ledcAttachPin(ENB, channelB);

  // Sensor
  pinMode(sensorHall, INPUT_PULLDOWN);
  ultimoEstadoSensor = digitalRead(sensorHall);
  Serial.print("Estado inicial do sensor: ");
  Serial.println(ultimoEstadoSensor == HIGH ? "HIGH (ímã perto)" : "LOW (sem ímã)");

  pararMotores();
}

void loop() {
  // Leitura Serial para ligar motores
  if (Serial.available()) {
    char c = Serial.read();
    if (c == '1') {
      Serial.println("Comando '1' recebido.");
      if (!motoresLigados) {
        ligarMotores();
        motoresLigados = true;
        Serial.println("Motores LIGADOS.");
      } else {
        Serial.println("Motores já estavam ligados.");
      }
    }
  }

  // Leitura do sensor Hall
  int estadoSensor = digitalRead(sensorHall);

  if (estadoSensor == HIGH && ultimoEstadoSensor == LOW) {
    // debounce
    if (millis() - lastTrigger > debounceMs) {
      Serial.println("Ímã detectado (borda HIGH)!");
      if (motoresLigados) {
        pararMotores();
        motoresLigados = false;
        Serial.println("Motores PARADOS pelo sensor.");
      } else {
        Serial.println("Motores já estavam parados.");
      }
      lastTrigger = millis();
    }
  }

  ultimoEstadoSensor = estadoSensor;
}

// Liga ambos os motores (frente, velocidade máxima)
void ligarMotores() {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(channelA, 255);
  ledcWrite(channelB, 255);
}

// Para ambos os motores
void pararMotores() {
  ledcWrite(channelA, 0);
  ledcWrite(channelB, 0);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}
