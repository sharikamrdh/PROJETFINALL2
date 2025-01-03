# recherche.py

import requests
import os
import time

PEXELS_API_KEY = os.getenv('PEXELS_API_KEY', '8kkg8wvGCp9ykxm6NobVt2321eHfHUuxUPYeUvCUqx80wY0SWpc0HrHc')
IMAGES_FOLDER = os.path.join(os.getcwd(), 'images')

def rechercher_image(keywords, per_page=1):
    url = 'https://api.pexels.com/v1/search'
    headers = {
        'Authorization': PEXELS_API_KEY
    }
    params = {
        'query': keywords,
        'per_page': per_page
    }

    response = requests.get(url, headers=headers, params=params)
    if response.status_code != 200:
        raise Exception(f"Erreur Pexels API : {response.status_code} - {response.text}")

    data = response.json()
    if not data['photos']:
        raise Exception("Aucune image trouvée pour les mots-clés fournis.")

    # Télécharger la première image
    photo = data['photos'][0]
    image_url = photo['src']['large']
    image_response = requests.get(image_url)
    if image_response.status_code != 200:
        raise Exception(f"Erreur lors du téléchargement de l'image : {image_response.status_code}")

    # Enregistrer l'image localement
    image_filename = os.path.basename(image_url)
    image_path = os.path.join(IMAGES_FOLDER, image_filename)
    with open(image_path, 'wb') as f:
        f.write(image_response.content)

    return image_path, image_url  # Retourner le chemin local et l'URL de l'image

