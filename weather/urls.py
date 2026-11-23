from django.urls import path
from weather import views

app_name = 'weather'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/weather/', views.weather_data, name='weather_data'),
    path('api/search/', views.city_search, name='city_search'),
    path('api/save-city/', views.save_city, name='save_city'),
]
