# app.py

from flask import Flask, render_template, request, jsonify, send_from_directory
import requests
import time
import threading
from flask_cors import CORS
from regles import *  # Assurez-vous que ce module est correctement défini
import subprocess
import os
import uuid  # Pour générer des noms de fichiers uniques

# Importer les modules refactorisés
from ascii_art import preprocess_image_with_opencv, image_to_ascii, extract_dominant_colors
from recherche import rechercher_image
from PIL import Image, ImageDraw, ImageFont  # Importer Pillow
import logging
import random

app = Flask(__name__)

# Configuration de base du logging
logging.basicConfig(
    level=logging.INFO,  # Niveau de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Affiche les logs dans le terminal
    ]
)

logger = logging.getLogger(__name__)

# Configuration des dossiers
app.config['IMAGES_FOLDER'] = os.path.join(app.root_path, 'images')
os.makedirs(app.config['IMAGES_FOLDER'], exist_ok=True)

# Configuration CORS avec origines spécifiques
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5173"}})

# Clé API Pexels (déjà définie dans recherche.py)
PEXELS_API_KEY = os.getenv('PEXELS_API_KEY', 'votre_clé_api_pexels')

# ASCII Art
ASCII_CHARS = ["@", "#", "S", "%", "?", "*", "+", ";", ":", ",", "."]
WIDTH_SCALE = 0.55

# Variables globales pour le jeu
game_state = {
    "sante_mentale": sante_mentale,       # Définie dans regles.py
    "niveau_actuel": niveau_actuel,       # Définie dans regles.py
    "inventaire": inventaire,             # Définie dans regles.py
    "temps_ecoule": 0,
    "luminosite": 0.5,
}

# Fonction pour convertir l'ASCII art en image
def ascii_to_image(ascii_art, image_filename, font_path=None, font_size=10):
    font = ImageFont.load_default() if not font_path else ImageFont.truetype(font_path, font_size)
    
    # Calculer la taille de chaque caractère
    bbox = font.getbbox('@')
    char_width = bbox[2] - bbox[0]
    char_height = bbox[3] - bbox[1]
    
    # Diviser l'ASCII art en lignes
    lines = ascii_art.split('\n')
    max_width = max(len(line) for line in lines)
    
    # Calculer la taille totale de l'image
    width = max_width * char_width
    height = len(lines) * char_height
    
    # Créer une image noire
    image = Image.new('RGB', (width, height), color=(0, 0, 0))
    draw = ImageDraw.Draw(image)
    
    # Dessiner le texte ASCII ligne par ligne
    for i, line in enumerate(lines):
        draw.text((0, i * char_height), line, font=font, fill=(255, 255, 255))
    
    # Enregistrer l'image
    image_path = os.path.join(app.config['IMAGES_FOLDER'], image_filename)
    image.save(image_path)
    
    return image_path

# Routes Flask
@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        # Étape 1 : Récupérer la description de l'utilisateur
        query = request.form.get('query', '').strip()
        if not query:
            return jsonify({"error": "La description est vide."}), 400

        # Étape 2 : Utiliser Ollama pour générer des mots-clés liés au scénario
        try:
            process = subprocess.run(
                ["ollama", "run", "Modelfile"],  # Remplacez "Modelfile" par votre modèle Ollama
                input=query,
                text=True,
                capture_output=True,
                check=True
            )
            generated_keywords = process.stdout.strip()
        except subprocess.CalledProcessError as e:
            return jsonify({"error": f"Erreur Ollama : {e.stderr}"}), 500
        except Exception as e:
            return jsonify({"error": f"Erreur lors de l'utilisation d'Ollama : {e}"}), 500

        # Étape 3 : Rechercher l'image via Pexels avec les mots-clés générés
        try:
            image_path, image_url = rechercher_image(generated_keywords, per_page=1)
            print(f"Image URL choisie : {image_url}")  # Afficher l'URL dans le terminal
            image_filename = os.path.basename(image_path)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        # Étape 4 : Transformer l'image en ASCII art
        try:
            ascii_art = image_to_ascii(image_path)
            if ascii_art.startswith("Erreur"):
                raise ValueError(ascii_art)
        except Exception as e:
            return jsonify({"error": f"Erreur lors de la transformation ASCII : {e}"}), 500

        # Étape 5 : Convertir l'ASCII art en image
        try:
            ascii_image_filename = f"ascii_{uuid.uuid4().hex}.png"
            ascii_image_path = ascii_to_image(ascii_art, ascii_image_filename)
        except Exception as e:
            return jsonify({"error": f"Erreur lors de la conversion ASCII en image : {e}"}), 500

        return jsonify({
            "generated_text": generated_keywords,  # Assurez-vous que 'generated_keywords' est ce que vous voulez renvoyer
            "ascii_image_path": f"/images/{ascii_image_filename}"
        })

    return render_template("index.html")

# Débuter le jeu
@app.route('/commencer', methods=['POST'])
def commencer():
    global game_state
    # Assurez-vous que 'joueur', 'sante_mentale', etc., sont définis dans regles.py
    game_state = {
        "position": {"x": joueur.x, "y": joueur.y},
        "sante_mentale": sante_mentale,
        "niveau_actuel": niveau_actuel,
        "inventaire": [item for item in inventaire if item != "Clé"],  # Suppression de "Clé"
        "temps_ecoule": 0,
        "luminosite": 0.5,
    }
    threading.Thread(target=gerer_temps_et_evenements, daemon=True).start()
    return jsonify({"message": "Le jeu commence !", "game_state": game_state})

# Mettre à jour la santé mentale
@app.route('/update_mental_health', methods=['POST'])
def update_mental_health():
    global sante_mentale
    data = request.get_json()
    if not data:
        return jsonify({"error": "Données non fournies."}), 400
    sante_mentale = data.get('mental_health', sante_mentale)
    return jsonify({"message": "Santé mentale mise à jour.", "sante_mentale": sante_mentale})

# Carte des objets
@app.route('/carte_objets', methods=['GET'])
def carte_objets():
    objets_dans_piece = detecter_objets()  # Définie dans regles.py
    objets_noms = [objet.nom for objet in objets_dans_piece]

    # Si la clé a déjà été utilisée, on la retire de la liste
    if cle_utilisee:
        objets_noms = [nom for nom in objets_noms if nom != "Clé"]

    return jsonify({
        "message": "Objets détectés dans la pièce actuelle.",
        "objets": objets_noms
    })

cle_utilisee = False

@app.route('/utiliser_cle', methods=['POST'])
def utiliser_cle():
    global cle_utilisee
    cle_utilisee = True
    return jsonify({"message": "Clé utilisée (côté serveur)", "success": True})

# Ramasser un objet
@app.route('/ramasser', methods=['POST'])
def ramasser():
    global game_state, objets_par_position_2d, inventaire, nb_objets_inventaire

    data = request.get_json()
    if not data:
        return jsonify({"message": "Données non fournies."}), 400
    x = data.get('x')
    y = data.get('y')
    tolerance = data.get('tolerance', 20)

    if x is None or y is None:
        return jsonify({"message": "Coordonnées (x, y) non fournies."}), 400

    for position, objet in list(objets_par_position_2d.items()):
        px, py = position
        if abs(px - x) <= tolerance and abs(py - y) <= tolerance:
            if nb_objets_inventaire < MAX_OBJETS:
                # Vérifiez si l'objet n'est pas déjà dans l'inventaire
                if objet.nom not in inventaire:
                    inventaire.append(objet.nom)
                    nb_objets_inventaire += 1
                    del objets_par_position_2d[position]

                    # Mise à jour de l'état du jeu
                    game_state["inventaire"] = inventaire
                    return jsonify({
                        "message": f"Vous avez ramassé : {objet.nom}",
                        "game_state": game_state
                    })
                else:
                    return jsonify({"message": f"L'objet {objet.nom} est déjà dans l'inventaire."}), 400
            else:
                return jsonify({"message": "Inventaire plein !", "game_state": game_state}), 400

    return jsonify({"message": "Aucun objet à proximité à ramasser.", "game_state": game_state}), 404

# Gestion des états du jeu
@app.route('/etat', methods=['GET'])
def etat():
    verifier_etat_jeu()  # Définie dans regles.py
    return jsonify(game_state)

# Événement aléatoire
@app.route('/evenement', methods=['POST'])
def evenement():
    try:
        evenement_type = evenement_aleatoire()  # Définie dans regles.py
        game_state["sante_mentale"] = sante_mentale  # Synchroniser avec l'état du jeu
        
        # Message de log indiquant qu'un événement a été généré
        logger.info(f"Événement aléatoire généré : Type = '{evenement_type}'")
        
        return jsonify({
            "message": f"Un événement aléatoire de type '{evenement_type}' s'est produit !",
            "game_state": game_state,
            "evenement_type": evenement_type  # Inclure le type d'événement
        }), 200  # Vous pouvez spécifier le code de statut HTTP si nécessaire
    except Exception as e:
        logger.error(f"Erreur lors de la génération de l'événement : {e}")
        return jsonify({"error": "Erreur lors de la génération de l'événement."}), 500


# Gérer le temps
@app.route('/gerer_temps', methods=['POST'])
def gerer_temps():
    global temps_ecoule
    gerer_evenements_temps()  # Définie dans regles.py
    message = f"Temps écoulé : {temps_ecoule} secondes."
    return jsonify({"message": message})

# Changer l'ambiance
@app.route('/changer_ambiance', methods=['POST'])
def changer_ambiance_route():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Données non fournies."}), 400
    luminosite = data.get('luminosite')
    if luminosite is None:
        return jsonify({"error": "Luminosité non fournie."}), 400
    changer_ambiance(luminosite)  # Définie dans regles.py
    message = "Ambiance changée."
    return jsonify({"message": message})

def gerer_temps_et_evenements():
    """Gère le temps et déclenche les événements aléatoires"""
    global game_state, temps_ecoule, temps_event
    debut = time.time()
    
    while True:
        time.sleep(1)  # Attendre 1 seconde
        maintenant = time.time()
        temps_ecoule += int(maintenant - debut)
        debut = maintenant

        gerer_evenements_temps()

        # Déclenche un événement aléatoire si le temps écoulé dépasse temps_event
        if temps_ecoule >= temps_event:
            evenement_type = evenement_aleatoire()
            game_state["sante_mentale"] = sante_mentale  # Synchroniser avec l'état du jeu
            logger.info(f"Événement aléatoire généré : Type = '{evenement_type}'")
            temps_ecoule = 0
            temps_event = random.randint(5, 15)  # Nouveau intervalle aléatoire
            

def verifier_position_automatique():
    global game_state
    if not est_position_valide(joueur.x, joueur.y):  # Définie dans regles.py
        print(f"Position invalide : ({joueur.x}, {joueur.y})")
        # Ajoutez ici la logique pour gérer une position invalide

# API pour générer des dialogues et le comportement du fantôme
@app.route('/generate', methods=['POST'])
def generate_text():
    """
    Génère du texte et une image ASCII basée sur le prompt fourni.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Données non fournies."}), 400
        prompt = data.get('prompt', '').strip()
        if not prompt:
            return jsonify({"error": "Prompt manquant"}), 400

        print(f"Prompt reçu : {prompt}")

        # Étape 1 : Génération de texte via Ollama ou un autre service
        try:
            process = subprocess.run(
                ["ollama", "run", "Modelfile"],  # Remplacez "Modelfile" par votre modèle Ollama
                input=prompt,
                text=True,
                capture_output=True,
                check=True
            )
            generated_text = process.stdout.strip()
            print(f"Texte généré : {generated_text}")
        except subprocess.CalledProcessError as e:
            return jsonify({"error": f"Erreur Ollama : {e.stderr}"}), 500
        except Exception as e:
            return jsonify({"error": f"Erreur lors de l'utilisation d'Ollama : {e}"}), 500

        # Étape 2 : Extraction des mots-clés à partir du texte généré
        # Supposons que les mots-clés sont les 5 premiers mots
        keywords = extract_keywords(generated_text)  # Définie dans regles.py ou un autre module
        print(f"Mots-clés générés : {keywords}")

        # Étape 3 : Rechercher l'image via Pexels avec les mots-clés générés
        try:
            image_path, image_url = rechercher_image(keywords, per_page=1)
            print(f"Image URL choisie : {image_url}")  # Afficher l'URL dans le terminal
            image_filename = os.path.basename(image_path)
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        # Étape 4 : Transformer l'image en ASCII art
        try:
            ascii_art = image_to_ascii(image_path)
            if ascii_art.startswith("Erreur"):
                raise ValueError(ascii_art)
        except Exception as e:
            return jsonify({"error": f"Erreur lors de la transformation ASCII : {e}"}), 500

        # Étape 5 : Convertir l'ASCII art en image
        try:
            ascii_image_filename = f"ascii_{uuid.uuid4().hex}.png"
            ascii_image_path = ascii_to_image(ascii_art, ascii_image_filename)
        except Exception as e:
            return jsonify({"error": f"Erreur lors de la conversion ASCII en image : {e}"}), 500

        return jsonify({
            "generated_text": generated_text,
            "ascii_image_path": f"/images/{ascii_image_filename}"
        })

    except Exception as e:
        print(f"Erreur inattendue : {e}")
        return jsonify({"error": f"Erreur inattendue : {str(e)}"}), 500

# Fonction d'extraction des mots-clés (à définir selon vos besoins)
def extract_keywords(text):
    # Implémentez ici votre logique pour extraire les mots-clés du texte généré
    # Par exemple, en utilisant une méthode simple de séparation par virgules
    # ou en utilisant une bibliothèque de NLP comme spaCy ou NLTK
    # Voici un exemple simple :
    return ' '.join(text.split()[:5])  # Prenez les 5 premiers mots comme mots-clés

# Servir les images ASCII en tant qu'images
@app.route('/images/<path:filename>')
def serve_image(filename):
    """
    Sert les images et les fichiers ASCII depuis le dossier images.
    """
    return send_from_directory(app.config['IMAGES_FOLDER'], filename)

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)



