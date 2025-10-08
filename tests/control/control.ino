// Pinos motores
const int IN1 = 25;
const int IN2 = 26;
const int IN3 = 27;
const int IN4 = 14;

// Pinos PWM
const int ENA = 4;
const int ENB = 5;

// Configuração PWM
const int freq = 1000;
const int channelA = 0;
const int channelB = 1; 
const int resolution = 8;

void setup() {
  Serial.begin(115200);
  while (!Serial) {}

  Serial.println("\n=== Teste PWM nos dois motores ===");

  // Configura direção
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // Configura PWM nos canais
  ledcSetup(channelA, freq, resolution);
  ledcSetup(channelB, freq, resolution);

  // Associa canais aos pinos
  ledcAttachPin(ENA, channelA);
  ledcAttachPin(ENB, channelB);

  // Inicialmente parados
  pararMotores();
}

void loop() {
  Serial.println("\n[1] Frente - acelerando de 0% a 100%");
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  for (int vel = 0; vel <= 255; vel += 25) {
    ledcWrite(channelA, vel);
    ledcWrite(channelB, vel);
    Serial.print("Velocidade PWM: "); Serial.println(vel);
    delay(400);
  }

  delay(1000);

  Serial.println("\n[2] Ré - acelerando de 0% a 100%");
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  for (int vel = 0; vel <= 255; vel += 25) {
    ledcWrite(channelA, vel);
    ledcWrite(channelB, vel);
    Serial.print("Velocidade PWM: "); Serial.println(vel);
    delay(400);
  }

  delay(1000);

  Serial.println("\n[3] Parando motores");
  pararMotores();
  delay(1500);
}

void pararMotores() {
  ledcWrite(channelA, 0);
  ledcWrite(channelB, 0);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}
