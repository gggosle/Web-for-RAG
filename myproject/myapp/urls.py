from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet, index, chat, chat_response, admin, upload_data, delete_data, delete_all_data, list_uploaded_files

router = DefaultRouter()
router.register(r'items', ItemViewSet)

urlpatterns = [
    path('', include(router.urls)),  
    path('index/', index, name='index'),
    path('chat/', chat, name='chat'),  
    path('admin/', admin, name='admin'),
    path('chat_response/', chat_response, name='chat_response'),  
    path('upload/', upload_data, name='upload_data'),  
    path('delete/', delete_data, name='delete_data'),  
    path('delete_all/', delete_all_data, name='delete_all_data'),  
    path('list_uploaded_files/', list_uploaded_files, name='list_uploaded_files'),
]
