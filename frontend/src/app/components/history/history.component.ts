import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Conversation } from '../../models/chat.models';
import { ChatService } from '../../services/chat.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  conversations: Conversation[] = [];
  isLoading = false;

  constructor(
    private chatService: ChatService,
    private stateService: StateService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {

    this.stateService.conversations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(conversations => {
        this.conversations = conversations;
      });


    this.stateService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
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


    this.loadConversations();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadConversations() {
    this.stateService.setLoading(true);
    
    try {
      const conversationHistory = await this.chatService.getConversations().toPromise();
      if (conversationHistory) {
        this.stateService.setConversations(conversationHistory.conversations);
      }
    } catch (error: any) {
      this.stateService.setError('Nie udało się załadować historii konwersacji');
      console.error('Error loading conversations:', error);
    } finally {
      this.stateService.setLoading(false);
    }
  }

  async openConversation(conversation: Conversation) {
    try {

      this.chatService.setCurrentConversation(conversation.id);
      

      const messageHistory = await this.chatService.getConversationMessages(conversation.id).toPromise();
      if (messageHistory) {
        this.chatService.updateMessages(messageHistory.messages);
      }
      

      this.router.navigate(['/chat']);
    } catch (error: any) {
      this.stateService.setError('Nie udało się otworzyć konwersacji');
      console.error('Error opening conversation:', error);
    }
  }

  async deleteConversation(conversation: Conversation, event: Event) {
    event.stopPropagation();
    
    if (!confirm(`Czy na pewno chcesz usunąć konwersację "${conversation.title}"?`)) {
      return;
    }

    try {
      await this.chatService.deleteConversation(conversation.id).toPromise();
      this.stateService.removeConversation(conversation.id);
      

      if (this.chatService.getCurrentConversationId() === conversation.id) {
        this.chatService.setCurrentConversation(null);
        this.chatService.clearMessages();
      }
      
      this.stateService.setSuccess('Konwersacja została usunięta');
    } catch (error: any) {
      this.stateService.setError('Nie udało się usunąć konwersacji');
      console.error('Error deleting conversation:', error);
    }
  }

  formatDate(dateInput: Date | string): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
      return 'Teraz';
    } else if (diffMins < 60) {
      return `${diffMins} min temu`;
    } else if (diffHours < 24) {
      return `${diffHours} godz. temu`;
    } else if (diffDays < 7) {
      return `${diffDays} dni temu`;
    } else {
      return date.toLocaleDateString('pl-PL');
    }
  }

  async createNewConversation() {
    try {
      const newConversation = await this.chatService.createConversation().toPromise();
      if (newConversation) {
        this.stateService.addConversation(newConversation);
        this.openConversation(newConversation);
      }
    } catch (error: any) {
      this.stateService.setError('Nie udało się utworzyć nowej konwersacji');
      console.error('Error creating conversation:', error);
    }
  }
}
