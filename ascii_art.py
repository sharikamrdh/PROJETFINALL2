# -*- coding: utf-8 -*-
# ascii_art.py

import cv2
import numpy as np
from sklearn.cluster import KMeans
import os
import time

ASCII_CHARS = ["@", "#", "S", "%", "?", "*", "+", ";", ":", ",", "."]
WIDTH_SCALE = 0.55

def extract_dominant_colors(image_path, n_colors=5):
    """
    Extrait les couleurs dominantes d'une image en utilisant le clustering K-Means.
    """
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Erreur : Impossible de charger l'image '{image_path}'")

    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = image.reshape((-1, 3))  # Réorganiser les pixels en un tableau 2D

    kmeans = KMeans(n_clusters=n_colors, random_state=0)
    kmeans.fit(image)

    colors = kmeans.cluster_centers_.astype(int)
    return [tuple(color) for color in colors]

def preprocess_image_with_opencv(image_path, ascii_filename):
    # Charger l'image en niveaux de gris
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)

    # Redimensionner l'image pour correspondre à la largeur souhaitée
    width = 100
    aspect_ratio = image.shape[0] / image.shape[1]
    height = int(aspect_ratio * width * 0.55)
    image = cv2.resize(image, (width, height))

    # Convertir chaque pixel en caractère ASCII
    ascii_str = ""
    for pixel_value in image.flatten():
        ascii_str += ASCII_CHARS[pixel_value // 25]
    
    # Diviser le string en lignes
    ascii_lines = [ascii_str[index: index + width] for index in range(0, len(ascii_str), width)]
    ascii_art = "\n".join(ascii_lines)

    # Enregistrer l'ASCII art dans un fichier texte
    ascii_path = os.path.join(os.path.dirname(image_path), ascii_filename)
    with open(ascii_path, 'w') as f:
        f.write(ascii_art)
    
    return ascii_filename  # Retourner seulement le nom du fichier

def image_to_ascii(image_path):
    """
    Transforme une image en art ASCII en niveaux de gris.
    Retourne l'art ASCII en texte brut.
    """
    try:
        # Charger l'image en niveaux de gris
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if image is None:
            raise ValueError(f"Erreur : Impossible de charger l'image '{image_path}'")

        # Redimensionner l'image pour correspondre à la largeur souhaitée
        width = 100
        aspect_ratio = image.shape[0] / image.shape[1]
        height = int(aspect_ratio * width * WIDTH_SCALE)
        image = cv2.resize(image, (width, height))

        # Convertir chaque pixel en caractère ASCII
        ascii_str = ""
        for pixel_value in image.flatten():
            ascii_str += ASCII_CHARS[pixel_value // 25]
        
        # Diviser le string en lignes
        ascii_lines = [ascii_str[index: index + width] for index in range(0, len(ascii_str), width)]
        ascii_art = "\n".join(ascii_lines)

        return ascii_art
    except Exception as e:
        return f"Erreur lors du traitement de l'image : {e}"
