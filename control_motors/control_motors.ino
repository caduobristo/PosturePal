#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

// Pinos motores 
const int IN1 = 25;
const int IN2 = 26;
const int IN3 = 27;
const int IN4 = 14;
const int ENA = 4;
const int ENB = 5;

// Sensor Hall 
const int HALL_PIN = 12;

// PWM
const int freq = 1000;
const int channelA = 0;
const int channelB = 1;
const int resolution = 8;

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

  // Sensor Hall
  pinMode(HALL_PIN, INPUT);

  off();
}

void loop() {
  // Verifica sensor Hall
  if (digitalRead(HALL_PIN) == HIGH) {
    Serial.println("Ímã detectado, parando motores!");
    off();
  }

  // Verifica comandos Bluetooth
  if (SerialBT.available()) {
    String comando = SerialBT.readStringUntil('\n');
    comando.trim();
    comando.toLowerCase();

    Serial.print("Comando recebido: ");
    Serial.println(comando);

    if (comando == "frente") {
      frente();
    } 
    else if (comando == "re") {
      re();
    } 
    else if (comando == "off") {
      off();
    }
  }
}

void frente() {
  Serial.println("Movendo para frente");
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  ledcWrite(channelA, 255);
  ledcWrite(channelB, 255);
}

void re() {
  Serial.println("Ré");
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);
  ledcWrite(channelA, 255);
  ledcWrite(channelB, 255);
}

void off() {
  Serial.println("Motores parados");
  ledcWrite(channelA, 0);
  ledcWrite(channelB, 0);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}
