import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, Subject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  ChatMessage, 
  Conversation,
  SendMessageRequest, 
  RateMessageRequest,
  RateMessageResponse,
  ConversationHistory,
  MessageHistory,
  ApiError,
  StreamMessageChunk
} from '../models/chat.models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly apiUrl = environment.apiUrl;
  
  private currentConversationSubject = new BehaviorSubject<string | null>(null);
  public currentConversation$ = this.currentConversationSubject.asObservable();
  
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  private currentAbortController: AbortController | null = null;

  constructor(private http: HttpClient) {}

  sendMessage(request: SendMessageRequest): Observable<StreamMessageChunk> {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    
    this.currentAbortController = new AbortController();
    const abortController = this.currentAbortController;
    
    return new Observable<StreamMessageChunk>(observer => {
      const url = this.apiUrl + '/chat/send';
      
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(request),
        signal: abortController.signal
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        const readStream = async () => {
          try {
            while (true) {
              if (abortController.signal.aborted) {
                observer.error(new Error('Request cancelled'));
                return;
              }
              
              const { done, value } = await reader.read();
              
              if (done) {
                observer.complete();
                break;
              }

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const rawData = JSON.parse(line.substring(6));
                    
                    const data: StreamMessageChunk = {
                      type: rawData.type || rawData.Type,
                      content: rawData.content || rawData.Content || '',
                      messageId: rawData.messageId || rawData.MessageId,
                      conversationId: rawData.conversationId || rawData.ConversationId,
                      timestamp: rawData.timestamp || rawData.Timestamp
                    };
                    
                    observer.next(data);
                    
                    if (data.type === 'complete' || data.type === 'error') {
                      observer.complete();
                      return;
                    }
                  } catch (error) {
                    console.error('Error parsing SSE data:', error);
                  }
                } else if (line.startsWith('event: ')) {
                }
              }
            }
          } catch (error) {
            observer.error(error);
          }
        };

        readStream();
      })
      .catch(error => {
        observer.error({ message: error.message, code: 'STREAM_ERROR' });
      });
      return () => {
      };
    });
  }

  rateMessage(request: RateMessageRequest): Observable<RateMessageResponse> {
    return this.http.post<RateMessageResponse>(this.apiUrl + '/chat/rate', request)
      .pipe(
        catchError(this.handleError)
      );
  }

  getConversations(): Observable<ConversationHistory> {
    return this.http.get<ConversationHistory>(this.apiUrl + '/conversations')
      .pipe(
        catchError(this.handleError)
      );
  }

  getConversationMessages(conversationId: string): Observable<MessageHistory> {
    return this.http.get<MessageHistory>(this.apiUrl + '/conversations/' + conversationId + '/messages')
      .pipe(
        catchError(this.handleError)
      );
  }

  createConversation(title?: string): Observable<Conversation> {
    const body = title ? { title } : {};
    return this.http.post<Conversation>(this.apiUrl + '/conversations', body)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteConversation(conversationId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(this.apiUrl + '/conversations/' + conversationId)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateConversationTitle(conversationId: string, title: string): Observable<Conversation> {
    return this.http.patch<Conversation>(this.apiUrl + '/conversations/' + conversationId, { title })
      .pipe(
        catchError(this.handleError)
      );
  }

  setCurrentConversation(conversationId: string | null): void {
    this.currentConversationSubject.next(conversationId);
  }

  getCurrentConversationId(): string | null {
    return this.currentConversationSubject.value;
  }

  updateMessages(messages: ChatMessage[]): void {
    this.messagesSubject.next(messages);
  }

  cancelCurrentRequest(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  addMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  updateMessage(messageId: string, updates: Partial<ChatMessage>): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = currentMessages.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    );
    this.messagesSubject.next(updatedMessages);
  }

  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError;

    if (error.error instanceof ErrorEvent) {
      apiError = {
        message: `Network error: ${error.error.message}`,
        code: 'NETWORK_ERROR'
      };
    } else {
      apiError = {
        message: error.error?.message || `Server error: ${error.status}`,
        code: error.error?.code || `HTTP_${error.status}`,
        details: error.error
      };
    }

    console.error('Chat service error:', apiError);
    return throwError(() => apiError);
  }
}
