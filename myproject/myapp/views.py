from django.shortcuts import render, HttpResponse
from rest_framework import viewsets
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import requests  
import os
from django.core.files.storage import FileSystemStorage
from django.conf import settings

UPLOAD_DIR = os.path.join(settings.MEDIA_ROOT, 'uploads')


def chat(request):
    return render(request, 'myapp/chat.html')  

def admin(request):
    return render(request, 'myapp/admin.html')


@csrf_exempt  
def chat_response(request):
    if request.method == 'POST':
        data = json.loads(request.body)  
        user_message = data.get('message', '')  

        try:
            flask_response = requests.post('http://localhost:5000/api/chat', json={'message': user_message})
            flask_response_data = flask_response.json()  

            bot_response = flask_response_data.get('response', 'No response from server')

        except requests.exceptions.RequestException as e:
           
            return JsonResponse({'error': str(e)}, status=500)

        return JsonResponse({'response': bot_response})  

    return JsonResponse({'error': 'Invalid request'}, status=400)


@csrf_exempt  
def upload_data(request):
    if request.method == 'POST' and request.FILES:
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        uploaded_file = request.FILES.get('file')  

        if uploaded_file:
            fs = FileSystemStorage(location=UPLOAD_DIR)
            filename = fs.save(uploaded_file.name, uploaded_file)
            file_path = os.path.join(UPLOAD_DIR, filename)

            with open(file_path, 'rb') as f:
                response = requests.post('http://localhost:5000/api/documents', files={'file': f})

            if response.status_code != 201:
                return JsonResponse({'error': 'Failed to send file to the service'}, status=500)

            return JsonResponse({"message": "File uploaded successfully"}, status=201)

        return JsonResponse({'error': 'No file uploaded'}, status=400)

    return JsonResponse({'error': 'Invalid request'}, status=400)


@csrf_exempt 
def delete_data(request):
    if request.method == 'DELETE':
        filename = request.GET.get('filename')  

        if not filename:
            return JsonResponse({'error': 'Filename is required'}, status=400)

        try:
            response = requests.delete(f'http://localhost:5000/api/documents/{filename}')

            if response.status_code == 200:
                file_path = os.path.join(UPLOAD_DIR, filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
                return JsonResponse({"message": "Document deleted"}, status=200)
            else:
                return JsonResponse({'error': 'Failed to delete document'}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)


@csrf_exempt 
def delete_all_data(request):
    if request.method == 'DELETE':
        try:
            response = requests.delete('http://localhost:5000/api/documents')

            if response.status_code == 200:
                for filename in os.listdir(UPLOAD_DIR):
                    file_path = os.path.join(UPLOAD_DIR, filename)
                    if os.path.isfile(file_path):
                        os.remove(file_path)
                return JsonResponse({"message": "All data deleted"}, status=200)
            else:
                return JsonResponse({'error': 'Failed to delete all documents'}, status=response.status_code)

        except requests.exceptions.RequestException as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)


@csrf_exempt
def list_uploaded_files(request):
    if request.method == 'GET':
        try:
            files = os.listdir(UPLOAD_DIR)  
            return JsonResponse({"files": files}, status=200)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)
