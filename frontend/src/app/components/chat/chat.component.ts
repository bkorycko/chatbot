import { Component, ViewChild, ElementRef, AfterViewChecked, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';

import { ChatMessage, RatingEnum } from '../../models/chat.models';
import { ChatService } from '../../services/chat.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private currentStreamSubscription: any = null;

  RatingEnum = RatingEnum;

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  isTyping = false;

  constructor(
    private snackBar: MatSnackBar,
    private chatService: ChatService,
    private stateService: StateService
  ) {}

  ngOnInit() {
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
      });

    this.stateService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    this.stateService.isTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe(typing => {
        this.isTyping = typing;
      });

    this.stateService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          this.snackBar.open(`❌ ${error}`, 'Zamknij', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }
      });

    this.initializeChat();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Błąd podczas przewijania:', err);
    }
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading || this.isTyping) {
      return;
    }

    const messageContent = this.currentMessage.trim();
    this.currentMessage = '';

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
      rating: RatingEnum.None
    };
    
    this.chatService.addMessage(userMessage);
    this.stateService.setLoading(true);

    try {
      await this.sendMessageWithStreaming(messageContent);
    } catch (error: any) {
      this.stateService.setLoading(false);
      this.stateService.setError(error.message || 'Nie udało się wysłać wiadomości');
      console.error('Error sending message:', error);
    }
  }

  private async sendMessageWithStreaming(messageContent: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let aiMessage: ChatMessage | null = null;
      let currentContent = '';

      this.currentStreamSubscription = this.chatService.sendMessage({
        message: messageContent,
        conversationId: this.chatService.getCurrentConversationId() || undefined
      }).subscribe({
        next: (chunk) => {
          switch (chunk.type) {
            case 'start':
              if (chunk.conversationId && !this.chatService.getCurrentConversationId()) {
                this.chatService.setCurrentConversation(chunk.conversationId);
              }

              aiMessage = {
                id: chunk.messageId || Date.now().toString(),
                content: '',
                isUser: false,
                timestamp: chunk.timestamp ? new Date(chunk.timestamp) : new Date(),
                rating: RatingEnum.None,
                conversationId: chunk.conversationId,
                isStreaming: true
              };
              this.chatService.addMessage(aiMessage);
              this.stateService.setLoading(false);
              this.stateService.setTyping(true);
              break;

            case 'chunk':
              if (aiMessage) {
                currentContent += (currentContent.length > 0 ? ' ' : '') + chunk.content;
                this.chatService.updateMessage(aiMessage.id, { 
                  content: currentContent,
                  isStreaming: true 
                });
                setTimeout(() => this.scrollToBottom(), 0);
              }
              break;

            case 'complete':
              if (aiMessage) {
                this.chatService.updateMessage(aiMessage.id, { 
                  isStreaming: false 
                });
                this.stateService.setTyping(false);
              }
              this.currentStreamSubscription = null;
              resolve();
              break;

            case 'error':
              console.error('Stream error:', chunk.content);
              this.stateService.setLoading(false);
              this.stateService.setTyping(false);
              this.currentStreamSubscription = null;
              reject(new Error(chunk.content));
              break;
          }
        },
        error: (error) => {
          this.stateService.setLoading(false);
          this.stateService.setTyping(false);
          this.currentStreamSubscription = null;
          if (error.message === 'Request cancelled') {
            resolve();
          } else {
            reject(error);
          }
        },
        complete: () => {
          this.stateService.setTyping(false);
          this.currentStreamSubscription = null;
          resolve();
        }
      });
    });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async clearChat() {
    if (this.isTyping) {
      this.cancelCurrentTyping();
    }

    try {
      const newConversation = await firstValueFrom(this.chatService.createConversation());
      
      if (newConversation) {
        this.chatService.setCurrentConversation(newConversation.id);
        
        const welcomeMessage: ChatMessage = {
          id: 'welcome-' + Date.now(),
          content: 'Witaj! Jestem Twoim asystentem AI. W czym mogę Ci pomóc?',
          isUser: false,
          timestamp: new Date(),
          rating: RatingEnum.None,
          conversationId: newConversation.id
        };
        
        this.chatService.updateMessages([welcomeMessage]);
        this.stateService.addConversation(newConversation);
      }
    } catch (error: any) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome-' + Date.now(),
        content: 'Witaj! Jestem Twoim asystentem AI. W czym mogę Ci pomóc?',
        isUser: false,
        timestamp: new Date(),
        rating: RatingEnum.None
      };
      
      this.chatService.setCurrentConversation(null);
      this.chatService.updateMessages([welcomeMessage]);
      this.stateService.setError('Nie udało się utworzyć nowej konwersacji');
    }
  }

  trackMessage(index: number, message: ChatMessage): string {
    return message.id;
  }

  async rateMessage(messageId: string, rating: RatingEnum) {
    const message = this.messages.find(m => m.id === messageId);
    if (!message || message.isUser) {
      return;
    }

    const previousRating = message.rating;
    let newRating: RatingEnum = rating;

    if (message.rating === rating) {
      newRating = RatingEnum.None;
    }

    this.chatService.updateMessage(messageId, { rating: newRating });

    try {
      await firstValueFrom(this.chatService.rateMessage({
        messageId,
        rating: newRating
      }));

    } catch (error: any) {
      this.chatService.updateMessage(messageId, { rating: previousRating });
      this.stateService.setError('Nie udało się zapisać oceny');
      console.error('Error rating message:', error);
    }
  }

  cancelCurrentTyping() {
    if (this.isTyping && this.currentStreamSubscription) {
      this.chatService.cancelCurrentRequest();
      
      if (this.currentStreamSubscription) {
        this.currentStreamSubscription.unsubscribe();
        this.currentStreamSubscription = null;
      }
      
      this.stateService.setTyping(false);
      this.stateService.setLoading(false);
      
      const currentMessages = this.messages;
      const lastMessage = currentMessages[currentMessages.length - 1];
      
      if (lastMessage && !lastMessage.isUser && lastMessage.isStreaming) {
        this.chatService.updateMessage(lastMessage.id, { 
          isStreaming: false,
          content: lastMessage.content + ' [Anulowano]'
        });
      }

      this.snackBar.open('⏹️ Generowanie odpowiedzi zostało anulowane', 'Zamknij', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  }

  private async initializeChat() {
    const currentConversationId = this.chatService.getCurrentConversationId();
    
    if (currentConversationId) {

      await this.loadConversation(currentConversationId);
    } else {

      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: 'Witaj! Jestem Twoim asystentem AI. W czym mogę Ci pomóc?',
        isUser: false,
        timestamp: new Date(),
        rating: RatingEnum.None
      };
      this.chatService.updateMessages([welcomeMessage]);
    }
  }

  private async loadConversation(conversationId: string) {
    this.stateService.setLoading(true);
    
    try {
      const messageHistory = await firstValueFrom(this.chatService.getConversationMessages(conversationId));
      if (messageHistory) {
        this.chatService.updateMessages(messageHistory.messages);
      }
    } catch (error: any) {
      this.stateService.setError('Nie udało się załadować konwersacji');
      console.error('Error loading conversation:', error);
    } finally {
      this.stateService.setLoading(false);
    }
  }

}
