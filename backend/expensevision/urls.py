import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse

def serve_spa(request):
    dist_index = os.path.join(settings.BASE_DIR.parent, 'frontend', 'dist', 'index.html')
    if os.path.exists(dist_index):
        with open(dist_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse(
        '<h1>ExpenseVision API is running</h1><p>Frontend build not found. Please run <code>npm run build</code> in the frontend folder.</p>',
        content_type='text/html'
    )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Catch-all route to serve React Single-Page Application on the same domain & port
urlpatterns += [
    re_path(r'^(?!api/|admin/|static/|media/).*$', serve_spa),
]
