# -*- coding: utf-8 -*-a
import time
import pygame 
import random 

# Initialisation de Pygame pour les effets sonores et visuels
pygame.init()
pygame.mixer.init()
screen = pygame.display.set_mode((800, 600))  # Taille de la fenêtre
pygame.display.set_caption("Jeu d'horreur")

# Directions possibles dans le jeu
NORD = 'NORD'
SUD = 'SUD'
EST = 'EST'
OUEST = 'OUEST'

# Structure de position pour le joueur
class Position:
    def __init__(self, x=0, y=0):
        self.x = x
        self.y = y

# Structure d'objet dans le jeu
class Objet:
    def __init__(self, nom, ramassable):
        self.nom = nom
        self.ramassable = ramassable

# Définir une carte des objets dans chaque pièce
objets_par_piece = {
    (0, 0): [Objet("Clé", True)],
    (1, 0): [Objet("Pomme", True)],
    (3, 0): [Objet("Photo", True)],
}

objets_par_position_2d = {
    (1200, 600): Objet("Note", True),
    (400, 600): Objet("Pistolet", True),
}


# Fonction pour détecter les objets dans la pièce actuelle
def detecter_objets():
    """Retourne une liste d'objets présents dans la pièce actuelle."""
    position_actuelle = (joueur.x, joueur.y)
    return objets_par_piece.get(position_actuelle, [])

# Fonction pour ramasser tous les objets dans la pièce
def ramasser_objets():
    """
    Ajoute tous les objets fixes visibles à l'inventaire.
    Les objets sont détectés selon leurs positions fixes sur l'écran.
    """
    global nb_objets_inventaire
    objets_ramasses = []  # Liste des objets ramassés

    for position, objet in list(objets_par_position_2d.items()):
        if nb_objets_inventaire < MAX_OBJETS:
            inventaire.append(objet)  # Ajouter l'objet à l'inventaire
            nb_objets_inventaire += 1
            objets_ramasses.append(objet.nom)
            del objets_par_position_2d[position]  # Supprimer l'objet de la carte
        else:
            print(f"Inventaire plein ! Impossible de ramasser {objet.nom}")
    
    if objets_ramasses:
        print(f"Vous avez ramassé : {', '.join(objets_ramasses)}")
    else:
        print("Aucun objet à ramasser.")


def ramasser_objet_proche(x, y, tolerance=20):
    """
    Ramasse un objet proche d'une position donnée (x, y) sur l'écran.
    """
    global nb_objets_inventaire
    for position, objet in list(objets_par_position_2d.items()):
        px, py = position
        if abs(px - x) <= tolerance and abs(py - y) <= tolerance:
            if nb_objets_inventaire < MAX_OBJETS:
                inventaire.append(objet)  # Ajouter l'objet à l'inventaire
                nb_objets_inventaire += 1
                del objets_par_position_2d[position]  # Supprimer l'objet de la carte
                print(f"Vous avez ramassé : {objet.nom}")
                return
            else:
                print(f"Inventaire plein ! Impossible de ramasser {objet.nom}")
                return
    
    print("Aucun objet à proximité à ramasser.")


# Initialisation de la position du joueur
joueur = Position(0, 0)  # Coordonnées initiales (0,0)

# Carte du jeu (0 = chemin libre, 1 = mur, 2 = porte, 3 = chaise, 4 = table, 5 = escalier, 6 = zone inaccessible)
carte = [
    [0, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 2, 0, 0],
    [0, 3, 4, 6]
]

# Inventaire du joueur
MAX_OBJETS = 10  # Capacité maximale de l'inventaire
inventaire = []  # Liste pour stocker les objets
nb_objets_inventaire = 0  # Compteur d'objets dans l'inventaire

# Santé mentale du joueur
sante_mentale = 100  # Valeur initiale de la santé mentale
niveau_actuel = 1  # Niveau actuel du joueur

# Variable pour suivre le temps écoulé
temps_ecoule = 0  # en secondes
temps_event = 10  # temps en secondes avant de déclencher un événement

# Charger les sons
effet_bruit_bizarres = pygame.mixer.Sound("assets/oppening_weird.wav")  # Exemple de bruit étrange
effet_porte_ouvre = pygame.mixer.Sound("assets/walk_door.wav")  # Exemple de son de porte

# Fonction pour jouer un bruit étrange
def jouer_bruit_bizarre():
    effet_bruit_bizarres.play()
    effet_bruit_bizarres.play(maxtime=1000)

    effet_bruit_bizarres.stop()  # Arrête le son en cours de lecture

# Fonction pour jouer un son de porte qui s'ouvre
def jouer_porte_ouvre():
    effet_porte_ouvre.play()

def est_position_valide(x, y):
    return 0 <= x < len(carte[0]) and 0 <= y < len(carte) and carte[y][x] in (0, 2, 5)

def deplacer_joueur(direction):
    """Déplace le joueur dans une direction donnée"""
    nouvelle_x = joueur.x  # Nouvelle coordonnée x
    nouvelle_y = joueur.y  # Nouvelle coordonnée y

    # Met à jour les coordonnées selon la direction
    if direction == NORD:
        nouvelle_y += 1
    elif direction == SUD:
        nouvelle_y -= 1
    elif direction == EST:
        nouvelle_x += 1
    elif direction == OUEST:
        nouvelle_x -= 1

    # Vérifie si le déplacement est valide
    if est_position_valide(nouvelle_x, nouvelle_y):
        joueur.x = nouvelle_x  # Met à jour la position du joueur
        joueur.y = nouvelle_y  # Met à jour la position du joueur
        print(f"Le joueur s'est déplacé vers {direction.lower()}.")
        objets_disponibles = detecter_objets()
        if objets_disponibles:
            print(f"Objets disponibles dans cette pièce : {[obj.nom for obj in objets_disponibles]}")
            
        if carte[nouvelle_y][nouvelle_x] == 2:
            jouer_porte_ouvre()  # Jouer le son lorsque le joueur passe devant une porte
    else:
        print(f"Déplacement impossible vers {direction.lower()}.")

def ajouter_objet_inventaire(objet):
    """Ajoute un objet à l'inventaire"""
    global nb_objets_inventaire
    if nb_objets_inventaire < MAX_OBJETS:
        inventaire.append(objet)  # Ajoute l'objet à l'inventaire
        nb_objets_inventaire += 1
        print(f"Vous avez ramassé : {objet.nom}")  # Affiche le nom de l'objet ramassé
    else:
        print(f"Inventaire plein ! Impossible de ramasser {objet.nom}")  # Message d'inventaire plein

def verifier_etat_jeu():
    """Vérifie l'état du jeu après chaque action"""
    global niveau_actuel, sante_mentale

    if sante_mentale <= 0:
        print("Vous avez perdu ! Votre santé mentale est tombée à zéro.")
        return  # Terminer le jeu ici ou rediriger vers un écran de fin

    if nb_objets_inventaire > 0:  # Exemple simple : gagner si au moins un objet est ramassé
        print(f"Félicitations ! Vous avez gagné au niveau {niveau_actuel}.")
        niveau_actuel += 1  # Passer au niveau suivant
        return

    # Vérification de la santé mentale
    if sante_mentale > 80:
        pass
        print("Votre santé mentale est au top !")
    elif sante_mentale > 50:
        pass
        print("Votre santé mentale est stable.")
    else:
        print("Attention, votre santé mentale commence à baisser.")

def gerer_evenements_temps():
    """Gère les événements de temps"""
    global sante_mentale, temps_ecoule

    if temps_ecoule >= temps_event:
        sante_mentale -= 5  # Diminuer la santé mentale
        print("La folie s'installe... Votre santé mentale diminue ! Santé mentale actuelle : {sante_mentale}")
        # ou mettre ca jouer_bruit_bizarre()  # Jouer un bruit étrange
        temps_ecoule = 0  # Réinitialiser le temps écoulé

def evenement_aleatoire():
    """Déclenche un événement aléatoire qui affecte le jeu."""
    global sante_mentale
    evenement = random.choice(["monstre", "hallucination", "choc"])

    if evenement == "monstre":
        print("Un monstre apparaît soudainement ! Votre santé mentale est perturbée.")
        sante_mentale -= 10
        scream = pygame.mixer.Sound("assets/scream.wav")  # Bruit de monstre pour l'effet

    elif evenement == "hallucination":
        print("Vous voyez des ombres se mouvoir avec un son de vent. Vous perdez un peu de votre santé mentale.")
        sante_mentale -= 5
        vent = pygame.mixer.Sound("/home/zaineb/Desktop/L2_PROJECT/vent.wav") 
        


    elif evenement == "choc":
        print("Un bruit des cries soudainement vous effraie !")

        screaming = pygame.mixer.Sound("assets/screaming.wav") 

        sante_mentale -= 3



def changer_ambiance(luminosite):
    """Créer un effet d'ambiance basé sur la luminosité (si implémenté à l'avenir)."""
    if luminosite > 0.5:
        print("Ambiance sombre")
    else:
        print("Ambiance lumineuse")


# Exemple d'appel de la fonction
changer_ambiance(0.3)  # Simule une ambiance sombre


# Modifier le volume si nécessaire
pygame.mixer.music.set_volume(0.5)

def gerer_hallucinations():
    """Simule des hallucinations si la santé mentale est faible."""
    if sante_mentale < 30:
        print("Des visions étranges apparaissent devant vos yeux. Votre santé mentale est à un niveau critique.")
        jouer_bruit_bizarre()  # Bruit pour augmenter l'effet d'angoisse
        # Ajouter des effets visuels ou des sons supplémentaires ici



def main():
    global temps_ecoule
    debut = time.time()  # Temps de début

    # Création d'objets

    cle = Objet("Clé", True)
    pomme = Objet("Pomme", True)
    pistolet = Objet("Pistolet", True)
    photo = Objet("Photo", True)
    note = Objet("Note", True)

    print("Bienvenue dans le jeu !")

    while True:
        maintenant = time.time()  # Temps actuel
        temps_ecoule += int(maintenant - debut)  # Incrémenter le temps écoulé
        debut = maintenant  # Réinitialiser le temps de début

        gerer_evenements_temps()

        action = input("\nAction (d: deplacer NORD, r: ramasser clé, p: ramasser pomme, t: ramasser photo, n: ramasser note, q: quitter) : ").strip().lower()

        if action == 'd':
            deplacer_joueur(NORD)
        elif action == 'r':
            ajouter_objet_inventaire(cle)
        elif action == 'p':
            ajouter_objet_inventaire(pomme)
        elif action == 't':
            ajouter_objet_inventaire(photo)
        elif action == 'n':
            ajouter_objet_inventaire(note)
        elif action == 'q':
            print("Merci d'avoir joué !")
            break
        else:
            print("Action non reconnue. Essayez à nouveau.")

        verifier_etat_jeu()

if __name__ == "__main__":
    main()

pygame.quit()