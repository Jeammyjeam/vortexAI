// DO NOT MODIFY. This file is auto-generated and managed by Firebase Studio.
import {EventEmitter} from 'events';
import {FirestorePermissionError} from './errors';

type Events = {
  'permission-error': (error: FirestorePermissionError) => void;
};

class TypedEventEmitter extends EventEmitter {
  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>): boolean {
    return super.emit(event, ...args);
  }
  on<E extends keyof Events>(event: E, listener: Events[E]): this {
    return super.on(event, listener);
  }
}

export const errorEmitter = new TypedEventEmitter();
