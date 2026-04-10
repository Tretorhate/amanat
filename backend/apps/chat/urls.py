from django.urls import path
from . import views

app_name = 'messages'

urlpatterns = [
    path('', views.MessageThreadListView.as_view(), name='thread-list'),
    path('<int:pk>/', views.MessageThreadDetailView.as_view(), name='thread-detail'),
    path('<int:thread_id>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('appeal/<int:appeal_id>/thread/', views.create_thread_for_appeal, name='create-thread-for-appeal'),
    path('message/<int:pk>/read/', views.mark_message_as_read, name='mark-message-read'),
    path('citizens/<int:telegram_user_id>/active_appeal_for_response/', views.get_active_appeal_for_citizen_response, name='get-active-appeal-for-response'),
    path('send_message_to_deputy/', views.send_message_from_citizen_to_deputy, name='send-message-to-deputy'),
    path('message/<int:message_id>/mark_read/', views.mark_message_as_read, name='mark-individual-message-read'),
    path('appeal/<int:appeal_id>/mark_messages_read/', views.mark_appeal_messages_as_read, name='mark-appeal-messages-read'),
]