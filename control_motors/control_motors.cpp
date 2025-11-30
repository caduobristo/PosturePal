#define IS_ESP32

#ifndef IS_ESP32

const float MAX_TIME_READ_ZERO = 0.5; // after this time reading zeros and car moving, it should stop
const float MACHINE_STATE_UPDATE_INTERVAL_MS = 50;

const float CAR_WHEEL_R = 0.00325;
const float CAR_WHEEL_CIRC = 2 * 3.1415 * CAR_WHEEL_R;
const float CTRL_SENSOR_PULSES_PER_ROT = 20;
const float CAR_MAX_VELOCITY = 1; // m/s

float ctrl_target_vel = 0.1;

#define CMD_GO_RIGHT 'a'
#define CMD_GO_LEFT 'b'
#define CMD_STOP 'c'
#define CMD_CTRL_UPDATE_TARGET_VEL 'i' // [1] atualizar velocidade target do controle
#define CMD_CTRL_TOGGLE 'j'
#define CMD_CTRL_UPDATE_PARAM 'k' // [1] parametro pra atualizar: p, i, d; [2] novo valor = val * 10.0/255 
#define CMD_UPDATE_PWM_PERC 'x' // [1] atualizar o valor do PWM (0-255 = 0%-100%)
#define CMD_TIMER_UPDATE_DURATION 'y' // [1] atualizar tempo do move duration em segundos
#define CMD_TIMER_TOGGLE 'z'

bool STATE_TIMER_ON = false;
bool STATE_CONTROL_ACTIVE = true;
unsigned char STATE_PWM_PERC = 255;
float STATE_MOVE_DURATION = 12;


#ifdef IS_ESP32
  #include "BluetoothSerial.h"

  BluetoothSerial SerialBT;
  #define MPRINT SerialBT.printf
  #define now_millis() millis()

  #define WRITE_PIN digitalWrite
  #define READ_PIN digitalRead
  #define WRITE_PWM ledcWrite
#else
  #include <stdio.h>
  #include <stdlib.h>
  #include <time.h>
  #include <stdint.h>
  #include <inttypes.h>
  #include <string>
  #include <vector>

  #define LOW 0
  #define HIGH 1

  #define MPRINT printf
  unsigned long now_millis() {
    return (unsigned long)(clock() * 1000 / CLOCKS_PER_SEC);
  }
  void delay(unsigned long ms) {
    unsigned long start = now_millis();
    while(now_millis() - start < ms);
  }

  std::vector<int> pins_values(256, 0);

  void WRITE_PIN(int pin, unsigned char value) {pins_values[pin] = value; }
  unsigned char READ_PIN(int pin) { return pins_values[pin]; }
  void WRITE_PWM(int channel, unsigned char value) { MPRINT("PWM Channel %d set to %d\n", channel, value); }

  class String {
  private:
      std::string data;

  public:
      String() {}
      String(const char* s) : data(s) {}
      String(const std::string& s) : data(s) {}

      unsigned char operator[](unsigned int idx) const {
          return data[idx];
      }

      String operator+(const String& other) const {
          return String(data + other.data);
      }

      String& operator+=(const String& other) {
          data += other.data;
          return *this;
      }

      int length() const {
          return data.length();
      }

      char* c_str() const {
          return data.c_str();
      }

      // Implicit conversions:
      operator std::string() const { return data; }
  };
#endif

// Pinos dos motores
const int IN1 = 25, IN2 = 26, IN3 = 27, IN4 = 14;
const int ENA = 4, ENB = 5;

// PWM
const int freq = 20000, channelA = 0, channelB = 1, resolution = 8;

// Sensores IR
const int IR_LEFT_DO = 34;
const int IR_RIGHT_DO = 35;
const bool IR_ACTIVE_LOW = true;
const uint8_t IR_HITS_TO_STOP = 2;
uint8_t irHits = 0;

// Encoder
const int CLK = 32;
volatile int enc_pulseCount = 0;

// Estado de direção e movimento
enum MovementState {
  MOV_RIGHT, MOV_LEFT, MOV_STOPPED
};
enum MovementState mov_state = MOV_STOPPED;

#ifdef IS_ESP32
// Interrupção do encoder
void IRAM_ATTR encoderISR() { enc_pulseCount++; }
#endif

int get_and_reset_pulse_count() {
    #ifdef IS_ESP32
    noInterrupts();
    int pulses = enc_pulseCount;
    enc_pulseCount = 0;
    interrupts();
    return pulses;
    #else
    return 1; // Simulação
    #endif
}

// Movement timer
unsigned long start_move_time = 0;
float time_since_mov_start() {
  return (now_millis() - start_move_time) * 0.001f;
}

// Control parameters
bool ctrl_is_init = false;
float ctrl_current_vel = 0;
float ctrl_P = 2;
float ctrl_I = 1;
float ctrl_D = 0;
float ctrl_kp_err = 0;
float ctrl_ki_err = 0;
float ctrl_kd_err = 0;

float ctrl_out_pwm = 0; // 0-1

unsigned long ctrl_sensor_last_read = 0;
unsigned long ctrl_sensor_first_zero_read = 0;
bool ctrl_sensor_is_zero = false;

float ctrl_sensor_time_reading_zero(){
  if(!ctrl_sensor_is_zero) return 0;
  return (now_millis() - ctrl_sensor_first_zero_read) * 0.001f;
}

void ctrl_reset(){
    ctrl_is_init = false;

    ctrl_kp_err = 0;
    ctrl_ki_err = 0;
    ctrl_kd_err = 0;
    ctrl_sensor_last_read = 0;
    ctrl_sensor_first_zero_read = 0;
    ctrl_sensor_is_zero = false;
}

void ctrl_init(){
    ctrl_reset();
    ctrl_sensor_last_read = now_millis();
    ctrl_is_init = true;
}

float ctrl_pulses2dist(int n_pulses){
    return CAR_WHEEL_CIRC * n_pulses / CTRL_SENSOR_PULSES_PER_ROT;
}

void ctrl_update_read_values(float dist){
    const unsigned long now = now_millis();
    const float dt = (now - ctrl_sensor_last_read) * 0.001f;
    if(dt <= 0) return;
    ctrl_sensor_last_read = now;

    if(dist == 0){
      if(!ctrl_sensor_is_zero){
        ctrl_sensor_is_zero = true;
        ctrl_sensor_first_zero_read = now;
      }
    }

    ctrl_current_vel = dist / dt;

    const float last_kp_err = ctrl_kp_err;
    const float err = ctrl_target_vel - ctrl_current_vel;

    ctrl_kp_err = err;
    ctrl_ki_err += err * dt;
    ctrl_kd_err = (ctrl_kp_err - last_kp_err) / dt;
}

void ctrl_update_out_pwm() {
    // PID output
    float P = ctrl_P * ctrl_kp_err;
    float I = ctrl_I * ctrl_ki_err;
    float D = ctrl_D * ctrl_kd_err;

    ctrl_out_pwm = P + I + D;
    if(ctrl_out_pwm > 1){
      ctrl_out_pwm = 1;
    } else if (ctrl_out_pwm < 0){
      ctrl_out_pwm = 0;
    }
}

void ctrl_cycle() {
  if(!ctrl_is_init) return;

  const int pulses = get_and_reset_pulse_count();
  const float dist = ctrl_pulses2dist(pulses);
  ctrl_update_read_values(dist);
  ctrl_update_out_pwm();
}

void update_mov_state(MovementState new_mov){
  if(new_mov == MOV_RIGHT) {
    if(mov_state != MOV_RIGHT){
      start_move_time = now_millis();
      ctrl_init();
    }
  } else if(new_mov == CMD_GO_LEFT) {
    if(mov_state != MOV_LEFT){
      start_move_time = now_millis();
      ctrl_init();
    }
  } else if(new_mov == CMD_STOP) {
    ctrl_reset();
    irHits = 0;
  }
  mov_state = new_mov;
}

void treat_cmd(String cmd) {
  // 'i' + n = atualizar velocidade target do controle
  // 'j' = toggle do sistema de controle
  // 'x' + n = atualizar o valor do PWM ('x' + porcentagem de 0-255, com 255=1, 0=1)
  // 'y' + n = atualizar tempo do move duration ('y' + tempo em segundos)
  // 'z' = toggle dot state timer
  if(cmd.length() < 1) return;

  if(cmd[0] == CMD_GO_RIGHT) {
    update_mov_state(MOV_RIGHT);
  } else if(cmd[0] == CMD_GO_LEFT) {
    update_mov_state(MOV_LEFT);
  } else if(cmd[0] == CMD_STOP) {
    update_mov_state(MOV_STOPPED);
  } else if(cmd[0] == CMD_CTRL_UPDATE_TARGET_VEL) {
    if(cmd.length() < 2) return;
    ctrl_target_vel = (CAR_MAX_VELOCITY * cmd[1]) / 255;
  } else if(cmd[0] == CMD_CTRL_TOGGLE) {
    STATE_CONTROL_ACTIVE = !STATE_CONTROL_ACTIVE;
  } else if(cmd[0] == CMD_CTRL_UPDATE_PARAM) {
    if(cmd.length() < 3) return;
    if(cmd[1] == 'p'){
      ctrl_P = (cmd[2] * 10.0f) / 255.0f;
    } else if(cmd[1] == 'i'){
      ctrl_I = (cmd[2] * 10.0f) / 255.0f;
    } else if(cmd[1] == 'd'){
      ctrl_D = (cmd[2] * 10.0f) / 255.0f;
    }
  } else if(cmd[0] == CMD_UPDATE_PWM_PERC) {
    if(cmd.length() < 2) return;
    STATE_PWM_PERC = cmd[1];
  } else if(cmd[0] == CMD_TIMER_UPDATE_DURATION) {
    if(cmd.length() < 2) return;
    STATE_MOVE_DURATION = cmd[1];
  } else if(cmd[0] == CMD_TIMER_TOGGLE) {
    STATE_TIMER_ON = !STATE_TIMER_ON;
  }
}

bool mov_must_stop(){
  if(ctrl_sensor_time_reading_zero() > MAX_TIME_READ_ZERO){
    MPRINT("parou tempo zerado\n");
    return true;
  }
  if(mov_state == MOV_LEFT){
    irHits += READ_PIN(IR_LEFT_DO) == LOW;
  }
  else if(mov_state == MOV_RIGHT) {
    irHits += READ_PIN(IR_RIGHT_DO) == LOW;
  }
  if(irHits > IR_HITS_TO_STOP){
      MPRINT("parou_IR\n");
      return true;
  }
  if(STATE_TIMER_ON && time_since_mov_start() >= STATE_MOVE_DURATION){
    return true;
  }

  return false;
}

void mov_machine_state() {
  // TODO: CHECK IF THESE DIRECTIONS ARE CORRECT
  if(mov_state == MOV_RIGHT){
    WRITE_PIN(IN1, LOW);  WRITE_PIN(IN2, HIGH);
    WRITE_PIN(IN3, HIGH); WRITE_PIN(IN4, LOW);
  } else if (mov_state == MOV_LEFT) {
    WRITE_PIN(IN1, HIGH); WRITE_PIN(IN2, LOW);
    WRITE_PIN(IN3, LOW);  WRITE_PIN(IN4, HIGH);
  } else if (mov_state == MOV_STOPPED) {
    WRITE_PIN(IN1, LOW); WRITE_PIN(IN2, LOW);
    WRITE_PIN(IN3, LOW);  WRITE_PIN(IN4, LOW);
    WRITE_PWM(channelA, 0); WRITE_PWM(channelB, 0);
    return;
  }

  ctrl_cycle();

  unsigned char pwm_write = STATE_PWM_PERC;
  if(STATE_CONTROL_ACTIVE){
    pwm_write = (unsigned char)(ctrl_out_pwm * 255);
  }

  WRITE_PWM(channelA, pwm_write); WRITE_PWM(channelB, pwm_write);
}


#ifndef IS_ESP32
void setup() {
  #ifdef IS_ESP32
  Serial.begin(115200);
  SerialBT.begin("PosturePal");
  #endif

  MPRINT("Bluetooth iniciado!\n");

  #ifdef IS_ESP32
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
  #else
  WRITE_PIN(IR_LEFT_DO, HIGH);
  WRITE_PIN(IR_RIGHT_DO, HIGH);
  #endif

  ctrl_reset();
  update_mov_state(MOV_STOPPED);
}

void print_state(){
  MPRINT("NOW: %d\n", int(now_millis()));

  MPRINT("target_vel: %f, current_vel: %f\n", ctrl_target_vel, ctrl_current_vel);
  MPRINT("ctrl_is_zero: %f, ctrl_firs_zero_read: %d\n", int(ctrl_sensor_is_zero), int(ctrl_sensor_first_zero_read));

  MPRINT("kp_err: %f, ki_err: %f, kd_err: %f\n", ctrl_kp_err, ctrl_ki_err, ctrl_kd_err);
  MPRINT("ctrl_out: %f\n", ctrl_out_pwm);
  MPRINT("pwm_out: %d\n", (unsigned char)(ctrl_out_pwm * 255));

  MPRINT("P: %f, I: %f, D: %f\n", ctrl_P, ctrl_I, ctrl_D);
  MPRINT("kp_err: %f, ki_err: %f, kd_err: %f\n", ctrl_kp_err, ctrl_ki_err, ctrl_kd_err);
  MPRINT("ctrl_out: %f\n", ctrl_out_pwm);
  MPRINT("pwm_out: %d\n", (unsigned char)(ctrl_out_pwm * 255));
  
  MPRINT("Mov state: ");
  if(mov_state == MOV_RIGHT) MPRINT("RIGHT\n");
  else if(mov_state == MOV_LEFT) MPRINT("LEFT\n");
  else if(mov_state == MOV_STOPPED) MPRINT("STOPPED\n");

  MPRINT("STATE_CONTROL_ACTIVE: %d\n", STATE_CONTROL_ACTIVE);
  MPRINT("STATE_PWM_PERC: %d\n", int(STATE_PWM_PERC));
  MPRINT("STATE_TIMER_ON: %d\n", int(STATE_TIMER_ON));
  MPRINT("STATE_MOVE_DURATION: %d\n", int(STATE_MOVE_DURATION));
  MPRINT("\n");
}

void loop() {
  // Comandos Bluetooth
  #ifdef IS_ESP32
  if (SerialBT.available()) {
    String comando = SerialBT.readStringUntil('\n');
  
    comando.trim();
    // comando.toLowerCase();

    MPRINT("Comando recebido: ");
    MPRINT(comando.c_str());
    MPRINT("\n");

    treat_cmd(comando);
  }
  #endif

  if(mov_must_stop()){
    update_mov_state(MOV_STOPPED);
  }

  mov_machine_state();
  delay(MACHINE_STATE_UPDATE_INTERVAL_MS);
}

int main(){
  setup();
  update_mov_state(MOV_RIGHT);
  while(true){
    loop();
    print_state();
  }
  return 0;
}
#endif
#endif