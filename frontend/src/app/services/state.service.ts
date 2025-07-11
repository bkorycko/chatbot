import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Conversation } from '../models/chat.models';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  private isTypingSubject = new BehaviorSubject<boolean>(false);
  public isTyping$ = this.isTypingSubject.asObservable();


  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();


  private successSubject = new BehaviorSubject<string | null>(null);
  public success$ = this.successSubject.asObservable();


  private conversationsSubject = new BehaviorSubject<Conversation[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();

  constructor() {}


  setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  setTyping(typing: boolean): void {
    this.isTypingSubject.next(typing);
  }


  setError(error: string | null): void {
    this.errorSubject.next(error);
    if (error) {

      setTimeout(() => this.clearError(), 5000);
    }
  }

  clearError(): void {
    this.errorSubject.next(null);
  }


  setSuccess(message: string | null): void {
    this.successSubject.next(message);
    if (message) {

      setTimeout(() => this.clearSuccess(), 3000);
    }
  }

  clearSuccess(): void {
    this.successSubject.next(null);
  }


  setConversations(conversations: Conversation[]): void {
    this.conversationsSubject.next(conversations);
  }

  addConversation(conversation: Conversation): void {
    const current = this.conversationsSubject.value;
    this.conversationsSubject.next([conversation, ...current]);
  }

  updateConversation(conversationId: string, updates: Partial<Conversation>): void {
    const current = this.conversationsSubject.value;
    const updated = current.map(conv => 
      conv.id === conversationId ? { ...conv, ...updates } : conv
    );
    this.conversationsSubject.next(updated);
  }

  removeConversation(conversationId: string): void {
    const current = this.conversationsSubject.value;
    const filtered = current.filter(conv => conv.id !== conversationId);
    this.conversationsSubject.next(filtered);
  }


  getCurrentConversations(): Conversation[] {
    return this.conversationsSubject.value;
  }

  getIsLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  getIsTyping(): boolean {
    return this.isTypingSubject.value;
  }
}
