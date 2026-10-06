/* Finite teaching fixtures, independently checked against the named rulebooks.
 * Source sections and expected outcomes: docs/skull-trick-sources.md.
 * No live game state or scoring is read or written. */
const SKULL_TRICKS = {
  "copy": {
    "title": {
      "en": "Who wins this trick?",
      "es": "¿Quién gana esta baza?"
    },
    "intro": {
      "en": "A trick is one card from each player, played clockwise. Here Ana leads, Bruno plays second, and Cami plays last. The winner takes these three cards and usually leads the next trick.",
      "es": "Una baza es una carta de cada persona, jugada en sentido horario. Aquí sale Ana, Bruno juega segundo y Cami juega última. Quien gana recoge estas tres cartas y normalmente inicia la siguiente baza."
    },
    "order": {
      "en": "Ana → Bruno → Cami → collect the trick",
      "es": "Ana → Bruno → Cami → recoger la baza"
    },
    "practice": {
      "en": "Practice table · 3 fictional players · no scores are recorded",
      "es": "Mesa de práctica · 3 personas ficticias · no se registran puntos"
    },
    "example": {
      "en": "Choose an example",
      "es": "Elige un ejemplo"
    },
    "base": {
      "en": "Core cards",
      "es": "Cartas básicas"
    },
    "options": {
      "en": "Optional base-box cards",
      "es": "Cartas opcionales de la caja base"
    },
    "powers": {
      "en": "Optional pirate powers",
      "es": "Poderes opcionales de piratas"
    },
    "expansion": {
      "en": "Expansion Pack",
      "es": "Paquete de expansión"
    },
    "optionsToggle": {
      "en": "Include Loot, Kraken and White Whale examples",
      "es": "Incluir ejemplos de Botín, Kraken y Ballena Blanca"
    },
    "powersToggle": {
      "en": "Include a pirate-power example",
      "es": "Incluir un ejemplo de poder de pirata"
    },
    "selectionNote": {
      "en": "These switches change this practice lesson only. Expansion Pack examples follow the guide’s expansion switch.",
      "es": "Estos controles solo cambian esta práctica. Los ejemplos del paquete de expansión siguen el interruptor de expansión de la guía."
    },
    "lead": {
      "en": "Lead / suit to follow",
      "es": "Salida / palo a seguir"
    },
    "hand": {
      "en": "Cami’s hand before playing",
      "es": "Mano de Cami antes de jugar"
    },
    "legal": {
      "en": "Legal",
      "es": "Permitida"
    },
    "illegal": {
      "en": "Cannot play now",
      "es": "No puede jugarla ahora"
    },
    "played": {
      "en": "Played in this example",
      "es": "Jugada en este ejemplo"
    },
    "schematic": {
      "en": "Schematic card",
      "es": "Carta esquemática"
    },
    "sequence": {
      "en": "Cards played, in clockwise order",
      "es": "Cartas jugadas, en orden horario"
    },
    "leader": {
      "en": "Leads",
      "es": "Sale primero"
    },
    "predict": {
      "en": "Predict the winner",
      "es": "Predice quién gana"
    },
    "nobody": {
      "en": "Nobody",
      "es": "Nadie"
    },
    "reveal": {
      "en": "Reveal and explain",
      "es": "Mostrar y explicar"
    },
    "correct": {
      "en": "Your prediction is correct.",
      "es": "Tu predicción es correcta."
    },
    "incorrect": {
      "en": "Review the cards: this trick has a different result.",
      "es": "Revisa las cartas: esta baza tiene otro resultado."
    },
    "winner": {
      "en": "Winner",
      "es": "Gana"
    },
    "nextLead": {
      "en": "Leads next",
      "es": "Sale en la siguiente"
    },
    "back": {
      "en": "Previous example",
      "es": "Ejemplo anterior"
    },
    "next": {
      "en": "Next example",
      "es": "Ejemplo siguiente"
    },
    "replay": {
      "en": "Replay",
      "es": "Repetir"
    },
    "source": {
      "en": "Rule source",
      "es": "Fuente de la regla"
    },
    "fullRule": {
      "en": "Full rule and exceptions",
      "es": "Regla completa y excepciones"
    },
    "artNote": {
      "en": "Published character artwork: Grandpa Beck’s Games. Numbered cards are labeled diagrams; use the names and explanations beside each image.",
      "es": "Imágenes de personajes publicadas por Grandpa Beck’s Games. Las numeradas son diagramas rotulados; lee los nombres y las explicaciones junto a cada imagen."
    }
  },
  "cards": {
    "green-4": {
      "name": {
        "en": "4 · Parrot · green",
        "es": "4 · Loro · verde"
      },
      "rank": 4,
      "suit": {
        "en": "Parrot · green",
        "es": "Loro · verde"
      }
    },
    "green-7": {
      "name": {
        "en": "7 · Parrot · green",
        "es": "7 · Loro · verde"
      },
      "rank": 7,
      "suit": {
        "en": "Parrot · green",
        "es": "Loro · verde"
      }
    },
    "green-10": {
      "name": {
        "en": "10 · Parrot · green",
        "es": "10 · Loro · verde"
      },
      "rank": 10,
      "suit": {
        "en": "Parrot · green",
        "es": "Loro · verde"
      }
    },
    "yellow-2": {
      "name": {
        "en": "2 · Treasure · yellow",
        "es": "2 · Tesoro · amarillo"
      },
      "rank": 2,
      "suit": {
        "en": "Treasure · yellow",
        "es": "Tesoro · amarillo"
      }
    },
    "yellow-12": {
      "name": {
        "en": "12 · Treasure · yellow",
        "es": "12 · Tesoro · amarillo"
      },
      "rank": 12,
      "suit": {
        "en": "Treasure · yellow",
        "es": "Tesoro · amarillo"
      }
    },
    "yellow-14": {
      "name": {
        "en": "14 · Treasure · yellow",
        "es": "14 · Tesoro · amarillo"
      },
      "rank": 14,
      "suit": {
        "en": "Treasure · yellow",
        "es": "Tesoro · amarillo"
      }
    },
    "purple-3": {
      "name": {
        "en": "3 · Map · purple",
        "es": "3 · Mapa · morado"
      },
      "rank": 3,
      "suit": {
        "en": "Map · purple",
        "es": "Mapa · morado"
      }
    },
    "purple-14": {
      "name": {
        "en": "14 · Map · purple",
        "es": "14 · Mapa · morado"
      },
      "rank": 14,
      "suit": {
        "en": "Map · purple",
        "es": "Mapa · morado"
      }
    },
    "black-2": {
      "name": {
        "en": "2 · Jolly Roger · black trump",
        "es": "2 · Bandera pirata · triunfo negro"
      },
      "rank": 2,
      "suit": {
        "en": "Jolly Roger · black trump",
        "es": "Bandera pirata · triunfo negro"
      }
    },
    "black-9": {
      "name": {
        "en": "9 · Jolly Roger · black trump",
        "es": "9 · Bandera pirata · triunfo negro"
      },
      "rank": 9,
      "suit": {
        "en": "Jolly Roger · black trump",
        "es": "Bandera pirata · triunfo negro"
      }
    },
    "black-14": {
      "name": {
        "en": "14 · Jolly Roger · black trump",
        "es": "14 · Bandera pirata · triunfo negro"
      },
      "rank": 14,
      "suit": {
        "en": "Jolly Roger · black trump",
        "es": "Bandera pirata · triunfo negro"
      }
    },
    "escape": {
      "name": {
        "en": "Escape",
        "es": "Huida"
      },
      "art": "sk-escape"
    },
    "pirate": {
      "name": {
        "en": "Pirate",
        "es": "Pirata"
      },
      "art": "sk-pirate"
    },
    "king": {
      "name": {
        "en": "Skull King",
        "es": "Skull King"
      },
      "art": "sk-king"
    },
    "mermaid": {
      "name": {
        "en": "Mermaid",
        "es": "Sirena"
      },
      "art": "sk-mermaid"
    },
    "kraken": {
      "name": {
        "en": "Kraken",
        "es": "Kraken"
      },
      "art": "sk-kraken"
    },
    "whale": {
      "name": {
        "en": "White Whale",
        "es": "Ballena Blanca"
      },
      "art": "sk-whale"
    },
    "loot": {
      "name": {
        "en": "Loot",
        "es": "Botín"
      },
      "art": "sk-loot"
    },
    "rosie": {
      "name": {
        "en": "Rosie D’Laney · Pirate",
        "es": "Rosie de Laney · Pirata"
      },
      "art": "sk-rosie"
    },
    "bendt": {
      "name": {
        "en": "Bendt · Pirate",
        "es": "Bendt · Pirata"
      },
      "art": "sk-bendt"
    },
    "tigress-escape": {
      "name": {
        "en": "Tigress → Escape",
        "es": "Tigresa → Huida"
      },
      "art": "sk-tigress",
      "declaration": {
        "en": "Declared as Escape",
        "es": "Declarada como Huida"
      }
    },
    "tigress-pirate": {
      "name": {
        "en": "Tigress → Pirate",
        "es": "Tigresa → Pirata"
      },
      "art": "sk-tigress",
      "declaration": {
        "en": "Declared as Pirate",
        "es": "Declarada como Pirata"
      }
    },
    "con": {
      "name": {
        "en": "First Mate Con",
        "es": "Primer oficial Con"
      },
      "art": "exp-con"
    }
  },
  "scenarios": [
    {
      "id": "follow-suit",
      "title": {
        "en": "Follow the led suit",
        "es": "Sigue el palo de salida"
      },
      "group": "base",
      "lead": {
        "en": "Ana leads green 7. Green is the suit to follow. Bruno has no green cards.",
        "es": "Ana sale con verde 7. Hay que seguir verde. Bruno no tiene cartas verdes."
      },
      "plays": [
        "green-7",
        "purple-14",
        "green-10"
      ],
      "hand": [
        {
          "card": "green-10",
          "legal": true,
          "why": {
            "en": "Matches the led suit.",
            "es": "Sigue el palo de salida."
          }
        },
        {
          "card": "yellow-14",
          "legal": false,
          "why": {
            "en": "You hold the led suit, so you cannot play another numbered suit.",
            "es": "Tienes el palo de salida, así que no puedes jugar otro palo numerado."
          }
        },
        {
          "card": "black-2",
          "legal": false,
          "why": {
            "en": "You hold the led suit, so you cannot play another numbered suit.",
            "es": "Tienes el palo de salida, así que no puedes jugar otro palo numerado."
          }
        }
      ],
      "winner": 2,
      "next": 2,
      "reasons": [
        {
          "en": "Green 7 loses to the higher green 10.",
          "es": "Verde 7 pierde ante el verde 10, que es mayor."
        },
        {
          "en": "Purple 14 is off suit; its larger number cannot beat green.",
          "es": "Morado 14 es de otro palo; su número mayor no supera al verde."
        },
        {
          "en": "Green 10 is the highest card of the led suit.",
          "es": "Verde 10 es la carta más alta del palo de salida."
        }
      ],
      "source": "Base pp. 5, 8–9, 13",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "tricks",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "black-trump",
      "title": {
        "en": "Black is trump",
        "es": "El negro es triunfo"
      },
      "group": "base",
      "lead": {
        "en": "Ana leads yellow 12. Follow yellow if you have it.",
        "es": "Ana sale con amarillo 12. Sigue amarillo si tienes."
      },
      "plays": [
        "yellow-12",
        "yellow-2",
        "black-2"
      ],
      "hand": [
        {
          "card": "black-2",
          "legal": true,
          "why": {
            "en": "No card of the led suit in this hand; another suit is legal.",
            "es": "Esta mano no tiene el palo de salida; puede jugar otro palo."
          }
        },
        {
          "card": "purple-14",
          "legal": true,
          "why": {
            "en": "No card of the led suit in this hand; another suit is legal.",
            "es": "Esta mano no tiene el palo de salida; puede jugar otro palo."
          }
        },
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "A special card is legal even when you hold the led suit.",
            "es": "Una carta especial está permitida aunque tengas el palo de salida."
          }
        }
      ],
      "winner": 2,
      "next": 2,
      "reasons": [
        {
          "en": "Yellow 12 loses to any black trump.",
          "es": "Amarillo 12 pierde ante cualquier triunfo negro."
        },
        {
          "en": "Yellow 2 is lower than yellow 12 and loses to trump.",
          "es": "Amarillo 2 es menor que amarillo 12 y pierde ante triunfo."
        },
        {
          "en": "Cami has no yellow. Black 2 beats both yellow cards.",
          "es": "Cami no tiene amarillo. Negro 2 supera a ambas amarillas."
        }
      ],
      "source": "Base pp. 8–9, 13",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "tricks",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "escape-lead",
      "title": {
        "en": "Escape delays the suit",
        "es": "Huida posterga el palo"
      },
      "group": "base",
      "lead": {
        "en": "Ana leads Escape. Bruno’s green 7 sets the suit: green.",
        "es": "Ana sale con Huida. El verde 7 de Bruno fija el palo: verde."
      },
      "plays": [
        "escape",
        "green-7",
        "escape"
      ],
      "hand": [
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "A special card is legal even when you hold the led suit.",
            "es": "Una carta especial está permitida aunque tengas el palo de salida."
          }
        },
        {
          "card": "green-4",
          "legal": true,
          "why": {
            "en": "Matches the led suit.",
            "es": "Sigue el palo de salida."
          }
        },
        {
          "card": "black-9",
          "legal": false,
          "why": {
            "en": "You hold the led suit, so you cannot play another numbered suit.",
            "es": "Tienes el palo de salida, así que no puedes jugar otro palo numerado."
          }
        }
      ],
      "winner": 1,
      "next": 1,
      "reasons": [
        {
          "en": "Escape loses to a numbered card.",
          "es": "Huida pierde ante una numerada."
        },
        {
          "en": "Green 7 is the only numbered card played.",
          "es": "Verde 7 es la única numerada jugada."
        },
        {
          "en": "Cami may play Escape even while holding green. It loses.",
          "es": "Cami puede jugar Huida aunque tenga verde. Pierde."
        }
      ],
      "source": "Base pp. 10, 12–13",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "hierarchy",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "all-escapes",
      "title": {
        "en": "When everyone escapes",
        "es": "Cuando todos huyen"
      },
      "group": "base",
      "lead": {
        "en": "Ana leads Escape; Bruno also escapes. No suit has been set.",
        "es": "Ana sale con Huida y Bruno también huye. Aún no se fijó palo."
      },
      "plays": [
        "escape",
        "escape",
        "tigress-escape"
      ],
      "hand": [
        {
          "card": "tigress-escape",
          "legal": true,
          "why": {
            "en": "A special card is legal even when you hold the led suit.",
            "es": "Una carta especial está permitida aunque tengas el palo de salida."
          }
        },
        {
          "card": "green-4",
          "legal": true,
          "why": {
            "en": "No suit yet; this would set green.",
            "es": "Aún no hay palo; esta fijaría verde."
          }
        },
        {
          "card": "black-9",
          "legal": true,
          "why": {
            "en": "No suit yet; this would set black.",
            "es": "Aún no hay palo; esta fijaría negro."
          }
        }
      ],
      "winner": 0,
      "next": 0,
      "reasons": [
        {
          "en": "All three cards act as Escapes, so the first wins.",
          "es": "Las tres actúan como Huida, así que gana la primera."
        },
        {
          "en": "This Escape was played after Ana’s.",
          "es": "Esta Huida se jugó después de la de Ana."
        },
        {
          "en": "Tigress was declared Escape when played; she loses this tie.",
          "es": "Tigresa se declaró Huida al jugarla; pierde este empate."
        }
      ],
      "source": "Base pp. 10–12",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "hierarchy",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "mermaid-numbers",
      "title": {
        "en": "Mermaid beats numbers",
        "es": "Sirena supera a las numeradas"
      },
      "group": "base",
      "lead": {
        "en": "Ana leads black 14. Black is the suit to follow. Bruno has no black.",
        "es": "Ana sale con negro 14. Hay que seguir negro. Bruno no tiene negro."
      },
      "plays": [
        "black-14",
        "yellow-14",
        "mermaid"
      ],
      "hand": [
        {
          "card": "mermaid",
          "legal": true,
          "why": {
            "en": "A special card is legal even when you hold the led suit.",
            "es": "Una carta especial está permitida aunque tengas el palo de salida."
          }
        },
        {
          "card": "black-2",
          "legal": true,
          "why": {
            "en": "Matches the led suit.",
            "es": "Sigue el palo de salida."
          }
        },
        {
          "card": "green-4",
          "legal": false,
          "why": {
            "en": "You hold the led suit, so you cannot play another numbered suit.",
            "es": "Tienes el palo de salida, así que no puedes jugar otro palo numerado."
          }
        }
      ],
      "winner": 2,
      "next": 2,
      "reasons": [
        {
          "en": "Even the highest black card loses to Mermaid.",
          "es": "Hasta la negra más alta pierde ante Sirena."
        },
        {
          "en": "Yellow cannot beat black or Mermaid.",
          "es": "Amarillo no supera al negro ni a Sirena."
        },
        {
          "en": "Mermaid beats all numbered cards.",
          "es": "Sirena supera a todas las numeradas."
        }
      ],
      "source": "Base pp. 8–11",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "hierarchy",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "pirate-mermaid",
      "title": {
        "en": "Pirate meets Mermaid",
        "es": "Pirata se cruza con Sirena"
      },
      "group": "base",
      "lead": {
        "en": "Ana leads Mermaid. No suit to follow for this trick.",
        "es": "Ana sale con Sirena. No hay palo que seguir en esta baza."
      },
      "plays": [
        "mermaid",
        "black-14",
        "pirate"
      ],
      "hand": [
        {
          "card": "pirate",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "green-4",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        }
      ],
      "winner": 2,
      "next": 2,
      "reasons": [
        {
          "en": "Without the King, Mermaid loses to Pirate.",
          "es": "Sin el Rey, Sirena pierde ante Pirata."
        },
        {
          "en": "Black 14 loses to both characters.",
          "es": "Negro 14 pierde ante ambos personajes."
        },
        {
          "en": "Pirate beats Mermaid and every numbered card.",
          "es": "Pirata supera a Sirena y a todas las numeradas."
        }
      ],
      "source": "Base pp. 10–12",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "hierarchy",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "king-pirate",
      "title": {
        "en": "The King beats Pirates",
        "es": "El Rey supera a los Piratas"
      },
      "group": "base",
      "lead": {
        "en": "Ana leads Pirate. No suit to follow for this trick.",
        "es": "Ana sale con Pirata. No hay palo que seguir en esta baza."
      },
      "plays": [
        "pirate",
        "black-14",
        "king"
      ],
      "hand": [
        {
          "card": "king",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "green-4",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        }
      ],
      "winner": 2,
      "next": 2,
      "reasons": [
        {
          "en": "Pirate loses to the Skull King.",
          "es": "Pirata pierde ante Skull King."
        },
        {
          "en": "Black 14 loses to Pirate and the King.",
          "es": "Negro 14 pierde ante Pirata y el Rey."
        },
        {
          "en": "No Mermaid is present, so the King wins.",
          "es": "No hay Sirena, así que gana el Rey."
        }
      ],
      "source": "Base pp. 10–12",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "hierarchy",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "three-characters",
      "title": {
        "en": "Pirate + King + Mermaid",
        "es": "Pirata + Rey + Sirena"
      },
      "group": "base",
      "lead": {
        "en": "Ana leads Pirate. No suit to follow for this trick.",
        "es": "Ana sale con Pirata. No hay palo que seguir en esta baza."
      },
      "plays": [
        "pirate",
        "king",
        "mermaid"
      ],
      "hand": [
        {
          "card": "mermaid",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "green-4",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        }
      ],
      "winner": 2,
      "next": 2,
      "reasons": [
        {
          "en": "Pirate normally beats Mermaid, but the King changes this combination.",
          "es": "Pirata normalmente supera a Sirena, pero el Rey cambia esta combinación."
        },
        {
          "en": "The King beats Pirate but loses to Mermaid.",
          "es": "El Rey supera a Pirata pero pierde ante Sirena."
        },
        {
          "en": "With all three together, Mermaid wins regardless of play order. There is no universal strongest card.",
          "es": "Con los tres juntos, Sirena gana sin importar el orden de juego. No hay una carta que siempre sea la más fuerte."
        }
      ],
      "source": "Base p. 11; publisher FAQ",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "hierarchy",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "tigress-pirate",
      "title": {
        "en": "Declare Tigress as Pirate",
        "es": "Declara Tigresa como Pirata"
      },
      "group": "base",
      "lead": {
        "en": "Ana leads Tigress and declares Pirate immediately. There is no suit to follow.",
        "es": "Ana sale con Tigresa y declara Pirata en ese momento. No hay palo que seguir."
      },
      "plays": [
        "tigress-pirate",
        "pirate",
        "mermaid"
      ],
      "hand": [
        {
          "card": "mermaid",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "green-4",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        }
      ],
      "winner": 0,
      "next": 0,
      "reasons": [
        {
          "en": "Tigress acts as the first Pirate and wins the Pirate tie.",
          "es": "Tigresa actúa como el primer Pirata y gana el empate de Piratas."
        },
        {
          "en": "This Pirate was played second, so it loses the tie.",
          "es": "Este Pirata se jugó segundo, así que pierde el empate."
        },
        {
          "en": "Mermaid loses to Pirates when no King is present.",
          "es": "Sirena pierde ante Piratas cuando no hay Rey."
        }
      ],
      "source": "Base pp. 10–12",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "hierarchy",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "tigress-escape",
      "title": {
        "en": "Declare Tigress as Escape",
        "es": "Declara Tigresa como Huida"
      },
      "group": "base",
      "lead": {
        "en": "Ana declares Tigress as Escape. Bruno’s yellow 12 sets yellow as the suit.",
        "es": "Ana declara Tigresa como Huida. El amarillo 12 de Bruno fija amarillo como palo."
      },
      "plays": [
        "tigress-escape",
        "yellow-12",
        "yellow-2"
      ],
      "hand": [
        {
          "card": "yellow-2",
          "legal": true,
          "why": {
            "en": "Matches the led suit.",
            "es": "Sigue el palo de salida."
          }
        },
        {
          "card": "black-9",
          "legal": false,
          "why": {
            "en": "You hold the led suit, so you cannot play another numbered suit.",
            "es": "Tienes el palo de salida, así que no puedes jugar otro palo numerado."
          }
        },
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "A special card is legal even when you hold the led suit.",
            "es": "Una carta especial está permitida aunque tengas el palo de salida."
          }
        }
      ],
      "winner": 1,
      "next": 1,
      "reasons": [
        {
          "en": "Declared Escape, Tigress cannot beat a numbered card.",
          "es": "Declarada Huida, Tigresa no supera a una numerada."
        },
        {
          "en": "Yellow 12 is higher than yellow 2.",
          "es": "Amarillo 12 es mayor que amarillo 2."
        },
        {
          "en": "Cami must follow yellow if playing a numbered card. Yellow 2 loses.",
          "es": "Si juega una numerada, Cami debe seguir amarillo. Amarillo 2 pierde."
        }
      ],
      "source": "Base pp. 10–12",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "hierarchy",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "kraken",
      "title": {
        "en": "Kraken destroys the trick",
        "es": "Kraken destruye la baza"
      },
      "group": "options",
      "lead": {
        "en": "Ana leads green 7. Bruno has no green and plays black 2.",
        "es": "Ana sale con verde 7. Bruno no tiene verde y juega negro 2."
      },
      "plays": [
        "green-7",
        "black-2",
        "kraken"
      ],
      "hand": [
        {
          "card": "kraken",
          "legal": true,
          "why": {
            "en": "A special card is legal even when you hold the led suit.",
            "es": "Una carta especial está permitida aunque tengas el palo de salida."
          }
        },
        {
          "card": "green-4",
          "legal": true,
          "why": {
            "en": "Matches the led suit.",
            "es": "Sigue el palo de salida."
          }
        },
        {
          "card": "yellow-14",
          "legal": false,
          "why": {
            "en": "You hold the led suit, so you cannot play another numbered suit.",
            "es": "Tienes el palo de salida, así que no puedes jugar otro palo numerado."
          }
        }
      ],
      "winner": null,
      "next": 1,
      "reasons": [
        {
          "en": "Green 7 would lose to black 2. Nobody keeps this trick.",
          "es": "Verde 7 perdería ante negro 2. Nadie se queda con esta baza."
        },
        {
          "en": "Without Kraken, Bruno’s black 2 would win; Bruno leads next.",
          "es": "Sin Kraken ganaría el negro 2 de Bruno; Bruno sale después."
        },
        {
          "en": "Kraken destroys the whole trick; nobody wins it.",
          "es": "Kraken destruye toda la baza; nadie la gana."
        }
      ],
      "source": "Base p. 23; publisher FAQ (Kraken correction)",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "base-options",
      "after": {
        "en": "Discard these cards. Bruno leads the next trick because he would have won without Kraken.",
        "es": "Descarten estas cartas. Bruno inicia la siguiente baza porque habría ganado sin Kraken."
      }
    },
    {
      "id": "white-whale",
      "title": {
        "en": "Whale compares only numbers",
        "es": "Ballena compara solo números"
      },
      "group": "options",
      "lead": {
        "en": "Ana leads black 2. Bruno has no black and plays yellow 14.",
        "es": "Ana sale con negro 2. Bruno no tiene negro y juega amarillo 14."
      },
      "plays": [
        "black-2",
        "yellow-14",
        "whale"
      ],
      "hand": [
        {
          "card": "whale",
          "legal": true,
          "why": {
            "en": "A special card is legal even when you hold the led suit.",
            "es": "Una carta especial está permitida aunque tengas el palo de salida."
          }
        },
        {
          "card": "black-9",
          "legal": true,
          "why": {
            "en": "Matches the led suit.",
            "es": "Sigue el palo de salida."
          }
        },
        {
          "card": "green-4",
          "legal": false,
          "why": {
            "en": "You hold the led suit, so you cannot play another numbered suit.",
            "es": "Tienes el palo de salida, así que no puedes jugar otro palo numerado."
          }
        }
      ],
      "winner": 1,
      "next": 1,
      "reasons": [
        {
          "en": "Whale removes trump’s advantage; 2 is less than 14.",
          "es": "Ballena elimina la ventaja del triunfo; 2 es menor que 14."
        },
        {
          "en": "Yellow 14 wins by number alone, regardless of suit.",
          "es": "Amarillo 14 gana solo por su número, sin importar el palo."
        },
        {
          "en": "Whale cannot win. Its effect does not remove the duty to follow the established suit.",
          "es": "Ballena no puede ganar. Su efecto no quita la obligación de seguir el palo ya fijado."
        }
      ],
      "source": "Base p. 24; publisher FAQ",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "base-options",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "loot",
      "title": {
        "en": "Loot follows Escape rules",
        "es": "Botín sigue las reglas de Huida"
      },
      "group": "options",
      "lead": {
        "en": "Ana leads Loot. Bruno’s green 7 sets green as the suit.",
        "es": "Ana sale con Botín. El verde 7 de Bruno fija verde como palo."
      },
      "plays": [
        "loot",
        "green-7",
        "green-10"
      ],
      "hand": [
        {
          "card": "green-10",
          "legal": true,
          "why": {
            "en": "Matches the led suit.",
            "es": "Sigue el palo de salida."
          }
        },
        {
          "card": "black-2",
          "legal": false,
          "why": {
            "en": "You hold the led suit, so you cannot play another numbered suit.",
            "es": "Tienes el palo de salida, así que no puedes jugar otro palo numerado."
          }
        },
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "A special card is legal even when you hold the led suit.",
            "es": "Una carta especial está permitida aunque tengas el palo de salida."
          }
        }
      ],
      "winner": 2,
      "next": 2,
      "reasons": [
        {
          "en": "Loot acts as Escape and loses to numbered cards.",
          "es": "Botín actúa como Huida y pierde ante las numeradas."
        },
        {
          "en": "Green 7 loses to green 10.",
          "es": "Verde 7 pierde ante verde 10."
        },
        {
          "en": "Green 10 wins. Loot’s alliance bonus requires both Ana and Cami to make their bids exactly.",
          "es": "Gana verde 10. La bonificación de alianza de Botín exige que Ana y Cami acierten sus apuestas."
        }
      ],
      "source": "Base pp. 10, 12, 25",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "base-options",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    },
    {
      "id": "rosie-power",
      "title": {
        "en": "Rosie chooses the next leader",
        "es": "Rosie elige quién sale después"
      },
      "group": "powers",
      "lead": {
        "en": "Ana leads Rosie, a Pirate. No suit to follow. Pirate powers are enabled for this example.",
        "es": "Ana sale con Rosie, un Pirata. No hay palo que seguir. Los poderes de piratas están activos en este ejemplo."
      },
      "plays": [
        "rosie",
        "black-14",
        "mermaid"
      ],
      "hand": [
        {
          "card": "mermaid",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "green-4",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        }
      ],
      "winner": 0,
      "next": 2,
      "reasons": [
        {
          "en": "Rosie wins as a Pirate and immediately uses her optional power.",
          "es": "Rosie gana como Pirata y usa su poder opcional inmediatamente."
        },
        {
          "en": "Black 14 loses to both characters.",
          "es": "Negro 14 pierde ante ambos personajes."
        },
        {
          "en": "Mermaid loses to Rosie. Ana chooses Cami to lead next.",
          "es": "Sirena pierde ante Rosie. Ana elige a Cami para salir después."
        }
      ],
      "source": "Base p. 26; publisher FAQ",
      "sourceUrl": "https://circlejgames.com/wp-content/uploads/2023/10/sk_rulebook_optimized.pdf",
      "rule": "pirate-powers",
      "after": {
        "en": "Ana keeps the trick but chooses Cami to lead next. Without pirate powers, Ana would lead.",
        "es": "Ana recoge la baza pero elige a Cami para salir después. Sin poderes de piratas, saldría Ana."
      }
    },
    {
      "id": "first-mate",
      "title": {
        "en": "Pirate + First Mate + Mermaid",
        "es": "Pirata + Primer oficial + Sirena"
      },
      "group": "expansion",
      "lead": {
        "en": "Ana leads Pirate. No suit to follow. Include First Mate Con for this example.",
        "es": "Ana sale con Pirata. No hay palo que seguir. Incluye a Primer oficial Con en este ejemplo."
      },
      "plays": [
        "pirate",
        "con",
        "mermaid"
      ],
      "hand": [
        {
          "card": "mermaid",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "green-4",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        },
        {
          "card": "escape",
          "legal": true,
          "why": {
            "en": "No suit was set by the character lead; any card is legal.",
            "es": "La salida de personaje no fijó palo; cualquier carta está permitida."
          }
        }
      ],
      "winner": 2,
      "next": 2,
      "reasons": [
        {
          "en": "Pirate loses to First Mate Con; this combination is won by Mermaid.",
          "es": "Pirata pierde ante Primer oficial Con; Sirena gana esta combinación."
        },
        {
          "en": "First Mate Con beats Pirate but loses to Mermaid.",
          "es": "Primer oficial Con supera a Pirata pero pierde ante Sirena."
        },
        {
          "en": "Mermaid wins with Pirate and First Mate Con together, regardless of play order.",
          "es": "Sirena gana cuando coinciden Pirata y Primer oficial Con, sin importar el orden."
        }
      ],
      "source": "Expansion p. 7; publisher expansion FAQ",
      "sourceUrl": "https://cdn.shopify.com/s/files/1/0565/3230/4053/files/Skull_King_Expansion_Rulebook_Web.pdf?v=1753214318",
      "rule": "expansion-pirates",
      "after": {
        "en": "The winner gathers the cards and leads the next trick.",
        "es": "Quien gana recoge las cartas e inicia la siguiente baza."
      }
    }
  ]
};

// Portable guide presentation. React renders the same fixtures on the hosted site.
// Deliberately memory-only: no preferences, scoreboard, bids or session writes.
const skullTrickPractice = {selected:'follow-suit',options:false,powers:false,answers:{}};
function skullTrickScenarios(){return SKULL_TRICKS.scenarios.filter(s=>s.group==='base'||(s.group==='options'&&skullTrickPractice.options)||(s.group==='powers'&&skullTrickPractice.powers)||(s.group==='expansion'&&state.skullExpansion));}
function skullTrickLesson(){
  const t=key=>e(SKULL_TRICKS.copy[key]), list=skullTrickScenarios(), s=list.find(s=>s.id===skullTrickPractice.selected)||list[0], index=list.indexOf(s), answer=skullTrickPractice.answers[s.id]||{}, players=['Ana','Bruno','Cami'];
  const name=i=>i===null||i===-1?t('nobody'):players[i];
  const card=id=>{const c=SKULL_TRICKS.cards[id];return `${c.art?officialButton(c.art,'lesson-card-art'):`<div class="trick-schematic"><small>${t('schematic')}</small><b>${c.rank}</b><span>${e(c.suit)}</span></div>`}<strong class="trick-card-name">${e(c.name)}</strong>${c.declaration?`<span class="trick-declaration">${e(c.declaration)}</span>`:''}`;};
  return `<section id="skull-trick-lesson" class="block skull-trick-lesson" aria-labelledby="skull-trick-title">
    <p class="eyebrow">${t('practice')}</p><h2 id="skull-trick-title">${t('title')}</h2><p>${t('intro')}</p><p class="trick-order">${t('order')}</p>
    <details class="trick-options"><summary>${t('options')} / ${t('powers')}</summary>
      <label><input id="trick-options-toggle" type="checkbox" ${skullTrickPractice.options?'checked':''}>${t('optionsToggle')}</label>
      <label><input id="trick-powers-toggle" type="checkbox" ${skullTrickPractice.powers?'checked':''}>${t('powersToggle')}</label><p>${t('selectionNote')}</p></details>
    <label class="trick-picker" for="trick-example">${t('example')}<select id="trick-example">${list.map(x=>`<option value="${x.id}" ${x.id===s.id?'selected':''}>${t(x.group)} · ${e(x.title)}</option>`).join('')}</select></label>
    <div class="trick-example" data-scenario="${s.id}"><p class="eyebrow">${t(s.group)} · ${index+1} / ${list.length}</p><h3 id="trick-heading" tabindex="-1">${e(s.title)}</h3><p><strong>${t('lead')}: </strong>${e(s.lead)}</p>
    <h4>${t('hand')}</h4><ul class="trick-hand">${s.hand.map(c=>`<li data-legal="${c.legal}"><strong>${e(SKULL_TRICKS.cards[c.card].name)}</strong><span>${c.legal?'✓ '+t('legal'):'× '+t('illegal')}</span><p>${e(c.why)}</p>${c.card===s.plays[2]?`<b>${t('played')}</b>`:''}</li>`).join('')}</ul>
    <h4>${t('sequence')}</h4><ol class="trick-table">${s.plays.map((id,i)=>`<li class="trick-play" data-player="${i}" data-winner="${!!answer.revealed&&s.winner===i}"><p class="trick-player">${i+1}. ${players[i]}${i===0?' · '+t('leader'):''}</p>${card(id)}${answer.revealed?`<p class="trick-reason">${s.winner===i?`<strong>✓ ${t('winner')} · </strong>`:''}${e(s.reasons[i])}</p>`:''}</li>`).join('')}</ol>
    <fieldset class="trick-prediction"><legend>${t('predict')}</legend>${[0,1,2,-1].map(i=>`<label><input id="trick-guess-${i}" type="radio" name="trick-winner" value="${i}" ${answer.guess===i?'checked':''}>${name(i)}</label>`).join('')}</fieldset>
    <button id="trick-reveal" type="button" class="accent-button" data-trick-reveal>${t('reveal')}</button>
    <div class="trick-result" role="status" aria-atomic="true">${answer.revealed?`${answer.guess!==undefined?`<p>${answer.guess===(s.winner??-1)?t('correct'):t('incorrect')}</p>`:''}<p><strong>${t('winner')}: ${name(s.winner)}. ${t('nextLead')}: ${name(s.next)}.</strong></p><p>${e(s.after)}</p><ul>${s.reasons.map((r,i)=>`<li>${players[i]}: ${e(r)}</li>`).join('')}</ul>`:''}</div>
    <nav class="trick-controls" aria-label="${t('example')}"><button type="button" id="trick-back" ${index===0?'disabled':''}>${t('back')}</button><button type="button" id="trick-replay">${t('replay')}</button><button type="button" id="trick-next" ${index===list.length-1?'disabled':''}>${t('next')}</button></nav>
    <details class="trick-source"><summary>${t('source')}</summary><p><a href="${s.sourceUrl}">${s.source}</a></p></details><a class="trick-rule" href="#skull_king/full/${s.rule}">${t('fullRule')} →</a></div><p class="image-note">${t('artNote')}</p></section>`;
}
function bindSkullTrickLesson(){
  const root=document.getElementById('skull-trick-lesson');if(!root)return;
  const list=skullTrickScenarios(),s=list.find(s=>s.id===skullTrickPractice.selected)||list[0],index=list.indexOf(s);
  const refresh=(focus)=>{
    const open=root.querySelector('.trick-options').open;
    // Keep the live region mounted so a revealed answer can be announced.
    const live=root.querySelector('.trick-result'), template=document.createElement('template');
    template.innerHTML=skullTrickLesson();
    const nextLive=template.content.querySelector('.trick-result'), message=nextLive.innerHTML;
    nextLive.replaceWith(live);root.replaceWith(template.content);
    document.querySelector('#skull-trick-lesson .trick-options').open=open;
    bindSkullTrickLesson();live.innerHTML=message;
    document.getElementById(focus)?.focus({preventScroll:true});
  };
  root.querySelector('#trick-example').onchange=ev=>{skullTrickPractice.selected=ev.target.value;refresh('trick-example');};
  for(const key of ['options','powers'])root.querySelector('#trick-'+key+'-toggle').onchange=ev=>{skullTrickPractice[key]=ev.target.checked;skullTrickPractice.selected='follow-suit';refresh('trick-'+key+'-toggle');};
  root.querySelectorAll('[name="trick-winner"]').forEach(r=>r.onchange=()=>{skullTrickPractice.answers[s.id]={guess:+r.value,revealed:false};refresh(r.id);});
  root.querySelector('#trick-reveal').onclick=()=>{skullTrickPractice.answers[s.id]={...skullTrickPractice.answers[s.id],revealed:true};refresh('trick-reveal');};
  root.querySelector('#trick-replay').onclick=()=>{skullTrickPractice.answers[s.id]={};refresh('trick-heading');};
  for(const [key,offset] of [['back',-1],['next',1]])root.querySelector('#trick-'+key).onclick=()=>{if(list[index+offset]){skullTrickPractice.selected=list[index+offset].id;refresh('trick-heading');}};
}
