#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

#define CMD_GO_RIGHT 'a'
#define CMD_GO_LEFT 'b'
#define CMD_STOP 'c'
#define CMD_CTRL_UPDATE_TARGET_VEL 'i'
#define CMD_CTRL_TOGGLE 'j'
#define CMD_UPDATE_PWM_PERC 'x'
#define CMD_TIMER_UPDATE_DURATION 'y'
#define CMD_TIMER_TOGGLE 'z'
#define CMD_FRONT_TOGGLE 'f'

const int IN1 = 25, IN2 = 26, IN3 = 27, IN4 = 14;
const int ENA = 4, ENB = 5;

const int freq = 20000, channelA = 0, channelB = 1, resolution = 8;

const int IR_LEFT_DO = 34;
const int IR_RIGHT_DO = 35;
const bool IR_ACTIVE_LOW = true;
const uint8_t IR_HITS_TO_STOP = 2;
uint8_t irHits = 0;

const int CLK = 32;
volatile int enc_pulseCount = 0;

bool STATE_TIMER_ON = false;
bool STATE_CONTROL_ACTIVE = false;
unsigned char STATE_PWM_PERC = 255;
float STATE_MOVE_DURATION = 12;

enum MovementState {
  MOV_RIGHT, MOV_LEFT, MOV_STOPPED
};
enum MovementState mov_state = MOV_STOPPED;
bool front_toggle_dir = false;

const float MAX_TIME_READ_ZERO = 0.5;
const float MACHINE_STATE_UPDATE_INTERVAL = 0.05;

const float CAR_WHEEL_R = 0.00325;
const float CAR_WHEEL_CIRC = 2 * 3.1415 * CAR_WHEEL_R;
const float CTRL_SENSOR_PULSES_PER_ROT = 20;
const float CAR_MAX_VELOCITY = 1;

void IRAM_ATTR encoderISR() { enc_pulseCount++; }

int get_and_reset_pulse_count() {
    noInterrupts();
    int pulses = enc_pulseCount;
    enc_pulseCount = 0;
    interrupts();
    return pulses;
}

unsigned long start_move_time = 0;
float time_since_mov_start() {
  return (millis() - start_move_time) * 0.001f;
}

bool ctrl_is_init = false;
float ctrl_target_vel = 0;
const float ctrl_P = 1;
const float ctrl_I = 1;
const float ctrl_D = 0;
float ctrl_kp_err = 0;
float ctrl_ki_err = 0;
float ctrl_kd_err = 0;

float ctrl_out_pwm = 0;
float ctrl_val_vel = 0;

unsigned long ctrl_sensor_last_read = 0;
unsigned long ctrl_sensor_first_zero_read = 0;
bool ctrl_sensor_is_zero = false;

float ctrl_sensor_time_reading_zero(){
  if(!ctrl_sensor_is_zero) return 0;
  return (millis() - ctrl_sensor_first_zero_read) * 0.001f;
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
    ctrl_sensor_last_read = millis();
    ctrl_is_init = true;
}

float ctrl_pulses2dist(int n_pulses){
    return CAR_WHEEL_CIRC * n_pulses / CTRL_SENSOR_PULSES_PER_ROT;
}

void ctrl_update_read_values(float dist){
    const unsigned long now = millis();
    const float dt = (now - ctrl_sensor_last_read) * 0.001f;
    if(dt <= 0) return;
    ctrl_sensor_last_read = now;

    if(dist == 0){
      if(!ctrl_sensor_is_zero){
        ctrl_sensor_is_zero = true;
        ctrl_sensor_first_zero_read = now;
      }
    }

    ctrl_val_vel = dist / dt;

    const float last_kp_err = ctrl_kp_err;
    const float err = ctrl_val_vel - ctrl_target_vel;

    ctrl_kp_err = err;
    ctrl_ki_err += err * dt;
    ctrl_kd_err = (ctrl_kp_err - last_kp_err) / dt;
}

void ctrl_update_out_pwm() {
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
      start_move_time = millis();
      ctrl_init();
    }
  } else if(new_mov == MOV_LEFT) {
    if(mov_state != MOV_LEFT){
      start_move_time = millis();
      ctrl_init();
    }
  } else if(new_mov == MOV_STOPPED) {
    ctrl_reset();
    irHits = 0;
  }
  mov_state = new_mov;
}

void treat_cmd(String cmd) {
  // Comando do app
  if (cmd[0] == CMD_FRONT_TOGGLE) {

    if (mov_state == MOV_STOPPED) {
        front_toggle_dir = false;
    } else {
        front_toggle_dir = !front_toggle_dir;
    }

    update_mov_state(front_toggle_dir ? MOV_LEFT : MOV_RIGHT);
    delay(1000);
    SerialBT.print("Movimento: ");
    SerialBT.println(front_toggle_dir ? "LEFT" : "RIGHT");

    return;
  }

  //Comando de teste e PID
  if(cmd[0] == CMD_GO_RIGHT) {
    update_mov_state(MOV_RIGHT);
  } else if(cmd[0] == CMD_GO_LEFT) {
    update_mov_state(MOV_LEFT);
  } else if(cmd[0] == CMD_STOP) {
    update_mov_state(MOV_STOPPED);
  } else if(cmd[0] == CMD_CTRL_UPDATE_TARGET_VEL) {
    unsigned char raw = cmd[1];
    ctrl_target_vel = (CAR_MAX_VELOCITY * raw) / 255.0;
    SerialBT.print("Velocidade alvo atualizada para: ");
    SerialBT.println(ctrl_target_vel);
  } else if(cmd[0] == CMD_CTRL_TOGGLE) {
    STATE_CONTROL_ACTIVE = !STATE_CONTROL_ACTIVE;
    ctrl_reset();
    SerialBT.print("Controle agora: ");
    SerialBT.println(STATE_CONTROL_ACTIVE ? "ON" : "OFF");
  } else if(cmd[0] == CMD_UPDATE_PWM_PERC) {
    STATE_PWM_PERC = (unsigned char)cmd[1];
    SerialBT.print("PWM atualizado para: ");
    SerialBT.println(STATE_PWM_PERC);
  } else if(cmd[0] == CMD_TIMER_UPDATE_DURATION) {
    STATE_MOVE_DURATION = cmd.substring(1).toFloat();
    SerialBT.print("Duracao atualizada: ");
    SerialBT.println(STATE_MOVE_DURATION);
  } else if(cmd[0] == CMD_TIMER_TOGGLE) {
    STATE_TIMER_ON = !STATE_TIMER_ON;
    SerialBT.print("Timer agora: ");
    SerialBT.println(STATE_TIMER_ON ? "ON" : "OFF");
  }
}

bool mov_must_stop(){
  if(ctrl_sensor_time_reading_zero() > MAX_TIME_READ_ZERO){
    SerialBT.println("parou tempo zerado");
    return true;
  }
  if(mov_state == MOV_LEFT){
    irHits += (digitalRead(IR_LEFT_DO) == LOW);
  }
  else if(mov_state == MOV_RIGHT) {
    irHits += (digitalRead(IR_RIGHT_DO) == LOW);
  }
  if(irHits > IR_HITS_TO_STOP){
      SerialBT.println("parou_IR");
      return true;
  }
  if(STATE_TIMER_ON && time_since_mov_start() >= STATE_MOVE_DURATION){
    return true;
  }

  return false;
}

void mov_machine_state() {
  if(mov_state == MOV_RIGHT){
    digitalWrite(IN1, LOW);  digitalWrite(IN2, HIGH);
    digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  } else if (mov_state == MOV_LEFT) {
    digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW);  digitalWrite(IN4, HIGH);
  } else if (mov_state == MOV_STOPPED) {
    digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
    digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
    ledcWrite(channelA, 0); ledcWrite(channelB, 0);
    return;
  }

  if(STATE_CONTROL_ACTIVE) {
    ctrl_cycle();
  }

  unsigned char pwm_write = STATE_PWM_PERC;
  if(STATE_CONTROL_ACTIVE){
    pwm_write = (unsigned char)(ctrl_out_pwm * 255);
  }

  ledcWrite(channelA, pwm_write);
  ledcWrite(channelB, pwm_write);
}

void frear(){
  mov_state = MOV_STOPPED;
  ledcWrite(channelA, 0);
  ledcWrite(channelB, 0);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}

void setup() {
  Serial.begin(115200);
  SerialBT.begin("PosturePal");

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

  ctrl_reset();
  frear();
}

void loop() {
  if (SerialBT.available()) {
    String comando = SerialBT.readStringUntil('\n');
    comando.trim();
    comando.toLowerCase();
    treat_cmd(comando);
  }

  if(mov_must_stop()){
    update_mov_state(MOV_STOPPED);
  }

  mov_machine_state();
  delay(MACHINE_STATE_UPDATE_INTERVAL * 1000);
}
