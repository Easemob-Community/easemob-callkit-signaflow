//log中为rtc信令的唯一标识
export type SignalingId = 'rtcCallWithAgora';

// 通话类型枚举
export enum CallType {
  Audio = 'CallTypeAudio',
  Video = 'CallTypeVideo',
  Group = 'CallTypeGroup'
}

// 通话结果枚举
export enum CallResult {
  Accept = 'accept',
  Refuse = 'refuse',
  Busy = 'busy'
}

// 呼叫状态枚举
export enum CallStatus {
  Valid = 1,
  Invalid = 0
}

// 信令类型枚举
export enum ActionType {
  CallInvite = 'CALL_INVITE',
  CallAlert = 'CALL_ALERT',
  CallConfirmRing = 'CALL_CONFIRM_RING',
  CallAnswer = 'CALL_ANSWER',
  CallConfirmCallee = 'CALL_CONFIRM_CALLEE',
  CallCancel = 'CALL_CANCEL',
  CallEnd = 'CALL_END'
}

// 基础信令接口
export interface BaseSignaling {
  callId: string;
  action: ActionType;
}

// 通话邀请信令接口
export interface CallInviteSignaling extends BaseSignaling {
  action: ActionType.CallInvite;
  channelName: string;
  callType: CallType;
  callerDevId: string;
  groupId?: string;
  receiverList?: string[];
}

// 响应信令接口
export interface CallAlertSignaling extends BaseSignaling {
  action: ActionType.CallAlert;
  calleeDevId: string;
}

// 确认振铃信令接口
export interface CallConfirmRingSignaling extends BaseSignaling {
  action: ActionType.CallConfirmRing;
  callStatus: CallStatus;
}

// 应答信令接口
export interface CallAnswerSignaling extends BaseSignaling {
  action: ActionType.CallAnswer;
  callResult: CallResult;
}

// 确认被叫信令接口
export interface CallConfirmCalleeSignaling extends BaseSignaling {
  action: ActionType.CallConfirmCallee;
  calleeDeviceId: string;
  callResult: CallResult;
}

// 取消呼叫信令接口
export interface CallCancelSignaling extends BaseSignaling {
  action: ActionType.CallCancel;
}

// 退出通话信令接口
export interface CallEndSignaling extends BaseSignaling {
  action: ActionType.CallEnd;
}

// 联合所有信令类型
export type Signaling = 
  | CallInviteSignaling
  | CallAlertSignaling
  | CallConfirmRingSignaling
  | CallAnswerSignaling
  | CallConfirmCalleeSignaling
  | CallCancelSignaling
  | CallEndSignaling;

// 信令消息类型映射
export type SignalingMap = {
  [ActionType.CallInvite]: CallInviteSignaling;
  [ActionType.CallAlert]: CallAlertSignaling;
  [ActionType.CallConfirmRing]: CallConfirmRingSignaling;
  [ActionType.CallAnswer]: CallAnswerSignaling;
  [ActionType.CallConfirmCallee]: CallConfirmCalleeSignaling;
  [ActionType.CallCancel]: CallCancelSignaling;
  [ActionType.CallEnd]: CallEndSignaling;
};
