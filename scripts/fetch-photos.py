#!/usr/bin/env python3
"""Find Wikimedia Commons photos, download them, and write data/photos.json.

A pancake gets a dish photo only when the file title names that dish.
Otherwise the page gets a landscape of the origin, labeled as a place.
"""

import json
import re
import time
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "photos"
MANIFEST = ROOT / "data" / "photos.json"
UA = "FlyingPancakes/1.0 (static journal; local build; https://jonldavis-coder.github.io/flying-pancakes/)"
API = "https://commons.wikimedia.org/w/api.php"

ALLOWED = re.compile(
    r"^(cc0|cc by( [0-9.]+)?|cc by-sa( [0-9.]+)?|public domain|no restrictions|pd|pdm|cc-pd)",
    re.I,
)
REJECT_LICENSE = re.compile(r"\b(nc|nd|noncommercial|no derivatives|fair use|all rights reserved|copyrighted)\b", re.I)
BAD_TITLE = re.compile(
    r"\b(illustration|drawing|diagram|map|logo|icon|stamp|coat of arms|flag of|portrait|painting|sketch|recipe|poster|cartoon|clipart|svg|vector|collage of flags)\b",
    re.I,
)
FOODISH = re.compile(
    r"pancake|dosa|crepe|crêpe|galette|blini|injera|roti|tortilla|arepa|bread|cake|jeon|okonomiyaki|"
    r"jianbing|fritter|omelet|omelette|farl|oatcake|crumpet|pikelet|poffertjes|lefse|latke|pupusa|"
    r"cachapa|baghrir|socca|farinata|hopper|appam|uttapam|cheela|chilla|paratha|bing|pitha|malpua|"
    r"takoyaki|dorayaki|martabak|bánh|banh|khanom|serabi|beiju|tapioca|johnnycake|johnny cake|hoecake|"
    r"hoe cake|frybread|fry bread|blintz|syrniki|rösti|rosti|kaiserschmarrn|pannenkoek|pannekoek|"
    r"flapjack|palacsinta|naleśniki|nalesniki|boxty|talo|filloa|qatayef|katayef|msemen|lahoh|canjeero|"
    r"kisra|masa\b|chapati|gözleme|gozleme|manakish|manakish|bolani|mchadi|vitumbua|mofo|bammy|"
    r"gordita|sope|tlacoyo|memela|baleada|milcao|llapingacho|mbeju|sopaipilla|buñuelo|bunuelo|"
    r"torreja|rabanada|harcha|mlawi|katmer|malawach|kuku|mutabbaq|jingalov|qutab|akıtma|akitma|"
    r"chebab|panikeke|babakau|touton|bannock|ploye|calas|funnel cake|piki|cornbread|matzo|matzah|"
    r"aebleskiver|æbleskiver|pandekage|pannkaka|plättar|plattar|raggmunk|äggakaka|kolbullar|lummur|"
    r"lettu|eierkuchen|kartoffel|schmarrn|palatschinken|oladyi|deruny|draniki|racuchy|placki|"
    r"clătite|clatite|palacink|flija|camarones|piadina|tiganites|taita|\bkita\b|mahjouba|"
    r"tatale|kabalagala|vitumbuwa|kaygana|saj\b|markook|paniyaram|pesarattu|adai|thalipeeth|amboli|"
    r"patishapta|alebele|chatamari|bindaetteok|hotteok|monjayaki|negiyaki|imagawayaki|danbing|"
    r"xianbing|canai|prata|dadar|kue ape|mont lin|chorreada|güirila|guirila|casabe|yaniqueque|"
    r"accras|almojábana|almojabana|dhalpuri|tacu|beiju|panqueca|sopaipilla|buttermilk|buckwheat|"
    r"blueberry|cranberry|pecan|peach|banana|pumpkin|gingerbread|chocolate chip|bacon|"
    r"sourdough|maple|sorghum|wild rice|plantain|silver.dollar|oatcake|potato cake|potato pancake|"
    r"rice cake|corn cake|cornmeal|griddle",
    re.I,
)
PLACE_WORDS = {
    "southern", "northern", "eastern", "western", "north", "south", "east", "west", "new", "upper",
    "cape", "san", "lowcountry", "appalachian", "english", "irish", "scottish", "scotch", "welsh",
    "dutch", "swedish", "norwegian", "danish", "finnish", "icelandic", "german", "russian", "polish",
    "french", "italian", "spanish", "portuguese", "greek", "mexican", "cuban", "jamaican", "haitian",
    "brazilian", "argentine", "chilean", "peruvian", "venezuelan", "colombian", "japanese", "korean",
    "chinese", "taiwanese", "indian", "thai", "filipino", "australian", "hawaiian", "alaskan",
    "vermont", "maine", "georgia", "texas", "florida", "minnesota", "michigan", "pennsylvania",
    "hudson", "orleans", "francisco", "york", "mexico", "england", "ireland", "scotland", "wales",
    "brittany", "normandy", "bavaria", "sicily", "andalusia", "galician", "basque", "aegean",
    "gaziantep", "mysore", "bengaluru", "kerala", "goan", "sri", "lankan", "bangladeshi", "nepali",
    "singaporean", "burmese", "dominican", "puerto", "rican", "trinidadian", "bahamian", "martinican",
    "honduran", "costa", "rican", "nicaraguan", "oaxacan", "paraguayan", "uruguayan", "bolivian",
    "eritrean", "ethiopian", "somali", "sudanese", "moroccan", "algerian", "tunisian", "egyptian",
    "nigerian", "ghanaian", "kenyan", "zambian", "malagasy", "ugandan", "djiboutian", "yemeni",
    "emirati", "turkish", "afghan", "azerbaijani", "armenian", "persian", "saudi", "lebanese",
    "georgian", "maori", "samoan", "fijian", "mauritian", "american", "diner", "midwest", "valley",
    "cod", "island", "islands", "city", "county",
}
GENERIC = {
    "pancake", "pancakes", "cake", "cakes", "hotcake", "hotcakes", "griddle", "style", "the", "and",
    "with", "of", "de", "la", "el", "le", "les", "des", "du", "di", "da", "dos", "del", "van", "von",
    "al", "bin", "bint",
}

# Extra search phrases and words that must NOT appear in a borrowed photo.
OVERRIDES = {
    "southern-buttermilk-pancakes": {"q": "buttermilk pancakes", "must": ["buttermilk"]},
    "diner-silver-dollars": {"q": "silver dollar pancakes", "must": ["silver"]},
    "rhode-island-johnnycakes": {"q": "johnnycake Rhode Island", "must": ["johnnycake", "johnny cake", "jonnycake"]},
    "southern-hoecakes": {"q": "hoecake", "must": ["hoecake", "hoe cake"]},
    "lacy-cornbread": {"q": "lacy cornbread", "must": ["cornbread", "corn bread"]},
    "appalachian-buckwheat-cakes": {"q": "buckwheat pancakes", "must": ["buckwheat"]},
    "appalachian-sorghum-pancakes": {"q": "sorghum pancakes", "must": ["sorghum"]},
    "appalachian-dried-apple-pancakes": {"q": "apple pancakes", "must": ["apple"]},
    "lowcountry-rice-griddle-cakes": {"q": "rice griddle cakes", "must": ["rice pancake", "rice cake"]},
    "sweet-potato-pancakes": {"q": "sweet potato pancakes", "must": ["sweet potato"]},
    "georgia-peach-pancakes": {"q": "peach pancakes", "must": ["peach"]},
    "texas-pecan-pancakes": {"q": "pecan pancakes", "must": ["pecan"]},
    "vermont-maple-pancakes": {"q": "pancakes maple syrup", "must": ["maple"]},
    "maine-blueberry-pancakes": {"q": "blueberry pancakes", "must": ["blueberry"]},
    "cape-cod-cranberry-hotcakes": {"q": "cranberry pancakes", "must": ["cranberry"]},
    "new-england-cornmeal-cakes": {"q": "cornmeal pancakes", "must": ["cornmeal", "corn meal"]},
    "hudson-valley-buckwheat-cakes": {"q": "buckwheat pancakes", "must": ["buckwheat"]},
    "pennsylvania-dutch-potato-pancakes": {"q": "potato pancakes", "must": ["potato pancake", "reibekuchen", "kartoffelpuffer"]},
    "pennsylvania-dutch-funnel-cakes": {"q": "funnel cake", "must": ["funnel"]},
    "indian-slapjack": {"q": "slapjack pancake", "must": ["slapjack"]},
    "hopi-piki": {"q": "piki bread Hopi", "must": ["piki"]},
    "new-mexico-blue-corn-hotcakes": {"q": "blue corn pancakes", "must": ["blue corn"]},
    "navajo-frybread": {"q": "Navajo frybread", "must": ["frybread", "fry bread"]},
    "dutch-baby": {"q": "Dutch baby pancake", "must": ["dutch baby"]},
    "cheese-blintzes": {"q": "cheese blintz", "must": ["blintz"]},
    "matzo-brei": {"q": "matzah brei", "must": ["matzo", "matzah", "matza"]},
    "upper-midwest-swedish-pancakes": {"q": "Swedish pancakes", "must": ["swedish pancake", "pannkaka", "pannkakor"]},
    "minnesota-wild-rice-pancakes": {"q": "wild rice pancakes", "must": ["wild rice"]},
    "michigan-cherry-pancakes": {"q": "cherry pancakes", "must": ["cherry"]},
    "alaska-sourdough-flapjacks": {"q": "sourdough pancakes", "must": ["sourdough"]},
    "bananas-foster-pancakes": {"q": "banana pancakes", "must": ["banana"]},
    "pumpkin-pancakes": {"q": "pumpkin pancakes", "must": ["pumpkin"]},
    "apple-cider-pancakes": {"q": "apple pancakes", "must": ["apple"]},
    "gingerbread-pancakes": {"q": "gingerbread pancakes", "must": ["gingerbread"]},
    "chocolate-chip-pancakes": {"q": "chocolate chip pancakes", "must": ["chocolate chip"]},
    "bacon-griddle-cakes": {"q": "bacon pancakes", "must": ["bacon"]},
    "lemon-ricotta-pancakes": {"q": "ricotta pancakes", "must": ["ricotta"]},
    "corn-oysters": {"q": "corn oyster fritters", "must": ["corn oyster", "corn fritter"]},
    "southern-banana-pancakes": {"q": "banana pancakes", "must": ["banana"]},
    "molasses-pancakes": {"q": "molasses pancakes", "must": ["molasses"]},
    "southeastern-corn-griddle-cakes": {"q": "cornmeal pancakes", "must": ["cornmeal", "corn cake", "hoecake"]},
    "hawaiian-banana-macadamia-hotcakes": {"q": "banana macadamia pancakes", "must": ["macadamia", "banana pancake"]},
    "san-francisco-sourdough-pancakes": {"q": "sourdough pancakes", "must": ["sourdough"]},
    "florida-plantain-pancakes": {"q": "plantain pancakes", "must": ["plantain"]},
    "new-orleans-calas": {"q": "calas rice fritters New Orleans", "must": ["calas"]},
    "english-shrove-pancakes": {"q": "English pancakes Shrove", "must": ["shrove", "english pancake"]},
    "spanish-tortilla": {"q": "tortilla de patatas", "must": ["tortilla de patatas", "spanish omelette", "spanish tortilla"]},
    "plain-dosa": {"q": "dosa", "must": ["dosa"], "forbid": ["masala", "rava", "onion", "uttapam", "pesarattu", "set dosa", "paper", "mysore", "ragi", "jowar", "egg"]},
    "masala-dosa": {"q": "masala dosa", "must": ["masala dosa"], "forbid": ["mysore"]},
    "rava-dosa": {"q": "rava dosa", "must": ["rava dosa"], "forbid": ["onion"]},
    "onion-rava-dosa": {"q": "onion rava dosa", "must": ["onion rava", "rava dosa"]},
    "paper-dosa": {"q": "paper dosa", "must": ["paper dosa", "crispy dosa"]},
    "set-dosa": {"q": "set dosa", "must": ["set dosa"]},
    "mysore-masala-dosa": {"q": "mysore masala dosa", "must": ["mysore"]},
    "neer-dosa": {"q": "neer dosa", "must": ["neer"]},
    "egg-hoppers": {"q": "egg hopper Sri Lanka", "must": ["egg hopper", "egg appam"]},
    "sri-lankan-hoppers": {"q": "Sri Lankan hopper appam", "must": ["hopper", "appam"]},
    "osaka-okonomiyaki": {"q": "okonomiyaki Osaka", "must": ["okonomiyaki"], "forbid": ["hiroshima"]},
    "hiroshima-okonomiyaki": {"q": "Hiroshima okonomiyaki", "must": ["hiroshima"]},
    "haemul-pajeon": {"q": "haemul pajeon seafood pancake", "must": ["haemul", "seafood pancake", "seafood pajeon"]},
    "kimchi-jeon": {"q": "kimchi jeon", "must": ["kimchi"]},
    "cong-you-bing": {"q": "scallion pancake cong you bing", "must": ["scallion pancake", "cong you bing", "green onion pancake"]},
    "tianjin-jianbing": {"q": "jianbing", "must": ["jianbing"]},
    "shandong-jianbing": {"q": "jianbing", "must": ["jianbing"]},
    "taiwanese-oyster-omelet": {"q": "oyster omelette Taiwan", "must": ["oyster omelet", "oyster omelette", "o-a-jian", "oyster omelet"]},
    "corn-tortilla": {"q": "corn tortillas", "must": ["tortilla"], "forbid": ["flour", "espanola", "española", "patata", "potato"]},
    "flour-tortilla": {"q": "flour tortillas", "must": ["flour tortilla"]},
    "arepa-de-choclo": {"q": "arepa de choclo", "must": ["choclo"]},
    "arepa-de-huevo": {"q": "arepa de huevo", "must": ["arepa de huevo", "arepa with egg"]},
    "arepa-boyacense": {"q": "arepa boyacense", "must": ["boyacense", "arepa boyac"]},
    "arepa-santandereana": {"q": "arepa santandereana", "must": ["santander"]},
    "brazilian-tapioca": {"q": "tapioca crepe Brazil", "must": ["tapioca"]},
    "potato-latkes": {"q": "potato latkes", "must": ["latke"]},
    "farmer-cheese-latkes": {"q": "syrniki cheese pancake", "must": ["syrniki", "cheese pancake", "curd pancake"]},
    "galette-complete": {"q": "galette complète", "must": ["galette complète", "galette complete"]},
    "crepes-suzette": {"q": "crêpes Suzette", "must": ["suzette"]},
    "ficelle-picarde": {"q": "ficelle picarde", "must": ["ficelle"]},
    "galette-saucisse": {"q": "galette saucisse", "must": ["galette-saucisse", "galette saucisse"]},
    "spekdik": {"q": "spekdik", "must": ["spekdik"]},
    "drie-in-de-pan": {"q": "drie in de pan pancakes", "must": ["drie in de pan"]},
    "flensjes": {"q": "flensjes", "must": ["flensjes"]},
    "kolbullar": {"q": "kolbulle", "must": ["kolbulle", "kolbullar"]},
    "aggakaka": {"q": "äggakaka", "must": ["äggakaka", "aggakaka"]},
    "aland-pancake": {"q": "Ålandspannkaka", "must": ["åland", "aland"]},
    "hortobagyi-palacsinta": {"q": "Hortobágyi palacsinta", "must": ["hortobágyi", "hortobagyi"]},
    "topfenpalatschinken": {"q": "Topfenpalatschinken", "must": ["topfen"]},
    "estonian-kohupiim-pancakes": {"q": "kohupiimakook or cottage cheese pancakes", "must": ["kohupiim", "cottage cheese pancake"]},
    "albanian-flija": {"q": "flija", "must": ["flija", "fli"]},
    "tortillitas-de-camarones": {"q": "tortillitas de camarones", "must": ["camarones"]},
    "portuguese-rabanadas": {"q": "rabanadas", "must": ["rabanada"]},
    "turnip-cake": {"q": "lo bak turnip cake", "must": ["turnip cake", "lo bak", "radish cake"]},
    "spring-pancakes": {"q": "spring pancake Chinese chunbing", "must": ["spring pancake", "chun bing", "spring roll pancake"]},
    "mandarin-pancakes": {"q": "Peking duck pancakes mandarin", "must": ["duck pancake", "mandarin pancake", "peking duck pancake", "chinese pancake"]},
    "egg-foo-young": {"q": "egg foo young", "must": ["egg foo young", "egg foo yung"]},
    "singaporean-roti-prata": {"q": "roti prata", "must": ["prata", "roti canai"]},
    "thai-roti": {"q": "roti sai mai OR Thai banana roti", "must": ["roti"]},
    "kue-ape": {"q": "kue ape", "must": ["kue ape", "kue ape"]},
    "burmese-mont-lin-maya": {"q": "mont lin maya", "must": ["mont lin"]},
    "filipino-hotcakes": {"q": "Filipino hotcakes", "must": ["hotcake", "pancake"]},
    "jamaican-festival": {"q": "Jamaican festival dumpling", "must": ["festival"]},
    "haitian-accras": {"q": "accras", "must": ["accra"]},
    "martinican-accras-de-morue": {"q": "accras de morue", "must": ["accras", "accra"]},
    "puerto-rican-almojabanas": {"q": "almojábana", "must": ["almojábana", "almojabana"]},
    "bolivian-bunuelos": {"q": "buñuelos", "must": ["buñuelo", "bunuelo"]},
    "mexican-bunuelos": {"q": "buñuelos mexicanos", "must": ["buñuelo", "bunuelo"]},
    "peruvian-tacu-tacu": {"q": "tacu tacu", "must": ["tacu"]},
    "chilean-milcao": {"q": "milcao Chiloé", "must": ["milcao"]},
    "uruguayan-panqueques": {"q": "panqueques dulce de leche", "must": ["panqueque", "panqueques", "crepe", "crêpe"]},
    "argentine-panqueques": {"q": "panqueques dulce de leche", "must": ["panqueque", "dulce de leche crepe", "crêpe"]},
    "chilean-panqueques": {"q": "panqueques", "must": ["panqueque", "crepe", "crêpe"]},
    "brazilian-panqueca": {"q": "panqueca brasileira", "must": ["panqueca"]},
    "maori-paraoa-parai": {"q": "Māori fry bread", "must": ["fry bread", "frybread", "paraoa"]},
    "samoan-panikeke": {"q": "panikeke", "must": ["panikeke"]},
    "fijian-babakau": {"q": "babakau", "must": ["babakau"]},
    "skillet-bannock": {"q": "bannock bread", "must": ["bannock"]},
    "newfoundland-toutons": {"q": "toutons Newfoundland", "must": ["touton"]},
    "acadian-ployes": {"q": "ploye Acadian", "must": ["ploye"]},
    "ulster-soda-farls": {"q": "soda farl", "must": ["soda farl", "soda bread"]},
    "singing-hinnies": {"q": "singing hinny", "must": ["singing hinny", "singin' hinny"]},
    "staffordshire-oatcakes": {"q": "Staffordshire oatcake", "must": ["oatcake"]},
    "derbyshire-oatcakes": {"q": "Derbyshire oatcake", "must": ["oatcake"]},
    "tattie-scones": {"q": "tattie scone", "must": ["tattie"]},
    "lancashire-potato-cakes": {"q": "Lancashire potato cake", "must": ["potato cake", "potato cake"]},
    "irish-boxty": {"q": "boxty", "must": ["boxty"]},
    "irish-potato-farls": {"q": "potato farl", "must": ["potato farl", "farl"]},
    "welsh-crempog": {"q": "crempog", "must": ["crempog"]},
    "english-crumpets": {"q": "crumpets", "must": ["crumpet"]},
    "english-pikelets": {"q": "pikelets", "must": ["pikelet"]},
    "scotch-pancakes": {"q": "Scotch pancakes drop scones", "must": ["scotch pancake", "drop scone", "scottish pancake"]},
    "flemish-pannekoeken": {"q": "Flemish pancakes", "must": ["pancake", "pannenkoek", "pannekoek"]},
    "dutch-pannenkoeken": {"q": "pannenkoeken", "must": ["pannenkoek", "pannekoek"]},
    "swedish-pannkakor": {"q": "Swedish pancakes pannkakor", "must": ["pannkaka", "swedish pancake"]},
    "swedish-plattar": {"q": "plättar", "must": ["plättar", "plattar"]},
    "svele": {"q": "svele", "must": ["svele"]},
    "norwegian-lefse": {"q": "lefse", "must": ["lefse"]},
    "danish-pandekager": {"q": "pandekager", "must": ["pandekage"]},
    "aebleskiver": {"q": "æbleskiver", "must": ["æbleskiver", "aebleskiver", "ebleskiver"]},
    "finnish-lettu": {"q": "Finnish pancakes lettu", "must": ["lettu", "finnish pancake", "ohukainen"]},
    "icelandic-ponnukokur": {"q": "pönnukökur", "must": ["pönnukaka", "ponnukokur", "icelandic pancake"]},
    "icelandic-lummur": {"q": "lummur Iceland", "must": ["lummur"]},
    "german-eierkuchen": {"q": "Eierkuchen", "must": ["eierkuchen", "pfannkuchen"]},
    "kartoffelpuffer": {"q": "Kartoffelpuffer", "must": ["kartoffelpuffer", "reibekuchen"]},
    "kaiserschmarrn": {"q": "Kaiserschmarrn", "must": ["kaiserschmarrn"]},
    "swiss-rosti": {"q": "rösti", "must": ["rösti", "rosti"]},
    "russian-blini": {"q": "blini", "must": ["blini", "blin"]},
    "buckwheat-blini": {"q": "buckwheat blini", "must": ["buckwheat blin", "гречневые"]},
    "oladyi": {"q": "oladyi", "must": ["oladyi", "oladji", "оладьи"]},
    "blinchiki": {"q": "blinchiki", "must": ["blinchik"]},
    "syrniki": {"q": "syrniki", "must": ["syrniki"]},
    "nalysnyky": {"q": "nalysnyky", "must": ["nalysnyk"]},
    "deruny": {"q": "deruny potato pancake", "must": ["deruny", "derun"]},
    "polish-nalesniki": {"q": "naleśniki", "must": ["naleśniki", "nalesniki"]},
    "placki-ziemniaczane": {"q": "placki ziemniaczane", "must": ["placki"]},
    "racuchy": {"q": "racuchy", "must": ["racuchy"]},
    "hungarian-palacsinta": {"q": "palacsinta", "must": ["palacsinta"]},
    "czech-palacinky": {"q": "palačinky", "must": ["palačink", "palacink"]},
    "czech-livance": {"q": "lívance", "must": ["lívance", "livance"]},
    "slovak-palacinky": {"q": "palacinky", "must": ["palacink"]},
    "romanian-clatite": {"q": "clătite", "must": ["clătite", "clatite"]},
    "bulgarian-palachinki": {"q": "palachinki", "must": ["palachink"]},
    "serbian-palacinke": {"q": "palačinke", "must": ["palačink", "palacink"]},
    "croatian-palacinke": {"q": "palačinke", "must": ["palačink", "palacink"]},
    "belarusian-draniki": {"q": "draniki", "must": ["draniki", "draniki"]},
    "lithuanian-bulviniai-blynai": {"q": "bulviniai blynai", "must": ["blynai", "potato pancake"]},
    "latvian-potato-pancakes": {"q": "kartupeļu pankūkas", "must": ["potato pancake", "pankūka", "latvian pancake"]},
    "filloas": {"q": "filloas", "must": ["filloa"]},
    "frixuelos": {"q": "frixuelos", "must": ["frixuelo"]},
    "spanish-tortitas": {"q": "tortitas pancakes Spain", "must": ["tortita", "pancake"]},
    "basque-talo": {"q": "talo Basque", "must": ["talo"]},
    "portuguese-panquecas": {"q": "panquecas", "must": ["panqueca"]},
    "crespelle": {"q": "crespelle", "must": ["crespelle"]},
    "piadina": {"q": "piadina", "must": ["piadina"]},
    "greek-tiganites": {"q": "tiganites", "must": ["tiganit"]},
    "injera": {"q": "injera", "must": ["injera"]},
    "eritrean-taita": {"q": "injera Eritrea", "must": ["injera", "taita"]},
    "ethiopian-kita": {"q": "kita Ethiopian flatbread", "must": ["kita"]},
    "somali-canjeero": {"q": "canjeero", "must": ["canjeero", "laxoox", "lahoh"]},
    "sudanese-kisra": {"q": "kisra", "must": ["kisra"]},
    "moroccan-baghrir": {"q": "baghrir", "must": ["baghrir"]},
    "msemen": {"q": "msemen", "must": ["msemen", "msemmen"]},
    "moroccan-harcha": {"q": "harcha", "must": ["harcha"]},
    "algerian-mahjouba": {"q": "mahjouba", "must": ["mahjouba"]},
    "tunisian-mlawi": {"q": "mlawi", "must": ["mlawi", "mlaoui"]},
    "egyptian-qatayef": {"q": "qatayef", "must": ["qatayef", "katayef", "atayef"]},
    "nigerian-masa": {"q": "masa waina Nigerian", "must": ["masa", "waina"]},
    "ghanaian-tatale": {"q": "tatale", "must": ["tatale"]},
    "kenyan-vitumbua": {"q": "vitumbua", "must": ["vitumbua"]},
    "zambian-vitumbuwa": {"q": "vitumbuwa", "must": ["vitumbuwa"]},
    "malagasy-mofo-gasy": {"q": "mofo gasy", "must": ["mofo gasy"]},
    "south-african-pannekoek": {"q": "South African pancakes", "must": ["pancake", "pannekoek"]},
    "ugandan-kabalagala": {"q": "kabalagala", "must": ["kabalagala"]},
    "kenyan-chapati": {"q": "Kenyan chapati", "must": ["chapati"]},
    "djiboutian-lahoh": {"q": "lahoh", "must": ["lahoh", "laxoox"]},
    "yemeni-lahoh": {"q": "lahoh Yemen", "must": ["lahoh"]},
    "emirati-chebab": {"q": "chebab pancake Emirates", "must": ["chebab"]},
    "turkish-gozleme": {"q": "gözleme", "must": ["gözleme", "gozleme"]},
    "turkish-akitma": {"q": "akıtma", "must": ["akıtma", "akitma"]},
    "gaziantep-katmer": {"q": "katmer Gaziantep", "must": ["katmer"]},
    "turkish-kaygana": {"q": "kaygana", "must": ["kaygana"]},
    "malawach": {"q": "malawach", "must": ["malawach", "malawah"]},
    "afghan-bolani": {"q": "bolani", "must": ["bolani"]},
    "azerbaijani-qutab": {"q": "qutab", "must": ["qutab"]},
    "armenian-jingalov-hats": {"q": "jingalov hats", "must": ["jingalov"]},
    "persian-kuku-sabzi": {"q": "kuku sabzi", "must": ["kuku"]},
    "saudi-mutabbaq": {"q": "mutabbaq", "must": ["mutabbaq"]},
    "lebanese-manakish": {"q": "manakish zaatar", "must": ["manakish", "manaeesh", "manakish"]},
    "saj-bread": {"q": "markook saj bread", "must": ["markook", "saj bread", "shrak"]},
    "georgian-mchadi": {"q": "mchadi", "must": ["mchadi"]},
    "australian-pikelets": {"q": "pikelets Australia", "must": ["pikelet"]},
    "australian-pancakes": {"q": "Australian pancakes", "must": ["pancake"]},
    "new-zealand-pikelets": {"q": "pikelets", "must": ["pikelet"]},
    "pajeon": {"q": "pajeon", "must": ["pajeon", "pa jeon"]},
    "bindaetteok": {"q": "bindaetteok", "must": ["bindaetteok", "nokdu"]},
    "gamjajeon": {"q": "gamjajeon", "must": ["gamja", "potato jeon"]},
    "buchujeon": {"q": "buchujeon", "must": ["buchu"]},
    "hotteok": {"q": "hotteok", "must": ["hotteok"]},
    "memiljeon": {"q": "memiljeon", "must": ["memil"]},
    "monjayaki": {"q": "monjayaki", "must": ["monjayaki", "monja"]},
    "negiyaki": {"q": "negiyaki", "must": ["negiyaki"]},
    "dorayaki": {"q": "dorayaki", "must": ["dorayaki"]},
    "imagawayaki": {"q": "imagawayaki", "must": ["imagawayaki", "obanyaki"]},
    "japanese-hotcakes": {"q": "Japanese hotcakes", "must": ["hotcake", "pancake"]},
    "souffle-hotcakes": {"q": "souffle pancakes", "must": ["souffle", "soufflé"]},
    "takoyaki": {"q": "takoyaki", "must": ["takoyaki"]},
    "taiwanese-danbing": {"q": "danbing Taiwan", "must": ["danbing", "dan bing", "egg crepe"]},
    "banh-xeo": {"q": "bánh xèo", "must": ["bánh xèo", "banh xeo"]},
    "banh-khot": {"q": "bánh khọt", "must": ["bánh khọt", "banh khot"]},
    "khanom-bueang": {"q": "khanom bueang", "must": ["khanom bueang", "kanom bueang"]},
    "khanom-krok": {"q": "khanom krok", "must": ["khanom krok", "kanom krok"]},
    "apam-balik": {"q": "apam balik", "must": ["apam balik"]},
    "roti-canai": {"q": "roti canai", "must": ["roti canai", "roti canal"]},
    "serabi": {"q": "serabi", "must": ["serabi", "surabi"]},
    "martabak-manis": {"q": "martabak manis", "must": ["martabak manis", "terang bulan"]},
    "martabak-telur": {"q": "martabak telur", "must": ["martabak telur", "martabak"]},
    "dadar-gulung": {"q": "dadar gulung", "must": ["dadar gulung"]},
    "uttapam": {"q": "uttapam", "must": ["uttapam", "uthappam"]},
    "pesarattu": {"q": "pesarattu", "must": ["pesarattu"]},
    "adai": {"q": "adai dosa", "must": ["adai"]},
    "ragi-dosa": {"q": "ragi dosa", "must": ["ragi"]},
    "jowar-dosa": {"q": "jowar dosa", "must": ["jowar"]},
    "appam": {"q": "appam Kerala", "must": ["appam"]},
    "nei-appam": {"q": "nei appam", "must": ["nei appam", "neyyappam"]},
    "kuzhi-paniyaram": {"q": "paniyaram", "must": ["paniyaram", "paddu", "gunta ponganalu"]},
    "besan-cheela": {"q": "besan cheela", "must": ["cheela", "chilla", "besan"]},
    "moong-dal-cheela": {"q": "moong dal cheela", "must": ["moong", "cheela", "chilla"]},
    "pudla": {"q": "pudla", "must": ["pudla"]},
    "thalipeeth": {"q": "thalipeeth", "must": ["thalipeeth"]},
    "amboli": {"q": "amboli", "must": ["amboli"]},
    "patishapta": {"q": "patishapta", "must": ["patishapta"]},
    "malpua": {"q": "malpua", "must": ["malpua"]},
    "goan-alebele": {"q": "alebele Goa", "must": ["alebele"]},
    "palak-cheela": {"q": "palak cheela", "must": ["palak", "spinach cheela", "spinach chilla"]},
    "pol-roti": {"q": "pol roti coconut", "must": ["pol roti", "coconut roti"]},
    "sri-lankan-coconut-pancakes": {"q": "Sri Lankan coconut pancake", "must": ["coconut pancake", "pancake"]},
    "bangladeshi-chitoi-pitha": {"q": "chitoi pitha", "must": ["chitoi"]},
    "nepali-chatamari": {"q": "chatamari", "must": ["chatamari"]},
    "aloo-paratha": {"q": "aloo paratha", "must": ["aloo paratha", "potato paratha"]},
    "mexican-hotcakes": {"q": "hotcakes pancakes", "must": ["hotcake", "pancake"]},
    "gorditas": {"q": "gorditas", "must": ["gordita"]},
    "tlacoyos": {"q": "tlacoyos", "must": ["tlacoyo"]},
    "sopes": {"q": "sopes mexican", "must": ["sope"]},
    "oaxacan-memelas": {"q": "memelas Oaxaca", "must": ["memela"]},
    "pupusas": {"q": "pupusas", "must": ["pupusa"]},
    "cuban-torrejas": {"q": "torrejas", "must": ["torreja"]},
    "jamaican-bammy": {"q": "bammy", "must": ["bammy"]},
    "dominican-casabe": {"q": "casabe", "must": ["casabe", "cassava bread"]},
    "dominican-yaniqueques": {"q": "yaniqueque", "must": ["yaniqueque", "johnnycake"]},
    "bahamian-johnnycake": {"q": "johnnycake Bahamas", "must": ["johnnycake", "johnny cake"]},
    "trinidadian-dhalpuri": {"q": "dhalpuri roti", "must": ["dhalpuri", "dal puri"]},
    "honduran-baleadas": {"q": "baleadas", "must": ["baleada"]},
    "costa-rican-chorreadas": {"q": "chorreadas", "must": ["chorreada"]},
    "nicaraguan-guirilas": {"q": "güirilas", "must": ["güirila", "guirila"]},
    "venezuelan-arepas": {"q": "arepas", "must": ["arepa"], "forbid": ["choclo", "huevo", "egg", "boyac", "santander"]},
    "colombian-arepas": {"q": "arepas Colombia", "must": ["arepa"], "forbid": ["choclo", "huevo", "boyac", "santander"]},
    "cachapas": {"q": "cachapas", "must": ["cachapa"]},
    "brazilian-beiju": {"q": "beiju", "must": ["beiju"]},
    "chilean-sopaipillas": {"q": "sopaipillas Chile", "must": ["sopaipilla"]},
    "llapingachos": {"q": "llapingachos", "must": ["llapingacho"]},
    "paraguayan-mbeju": {"q": "mbeju", "must": ["mbeju", "mbeyu"]},
    "crepes-bretonnes": {"q": "crêpes Bretagne", "must": ["crêpe", "crepe"], "forbid": ["suzette", "galette"]},
    "galette-de-sarrasin": {"q": "galette de sarrasin", "must": ["galette"], "forbid": ["complète", "complete", "saucisse"]},
    "normandy-apple-crepes": {"q": "apple crepes", "must": ["apple"]},
    "socca": {"q": "socca", "must": ["socca"]},
    "farinata": {"q": "farinata", "must": ["farinata"]},
    "poffertjes": {"q": "poffertjes", "must": ["poffertjes"]},
    "raggmunk": {"q": "raggmunk", "must": ["raggmunk"]},
    "scottish-oatcakes": {"q": "Scottish oatcakes", "must": ["oatcake"]},
    "irish-oatmeal-pancakes": {"q": "oatmeal pancakes", "must": ["oatmeal"]},
    "mauritian-crepes": {"q": "crêpes", "must": ["crêpe", "crepe"]},
}

LANDSCAPE_QUERIES = {
    "US-appalachia": "Great Smoky Mountains landscape",
    "US-new-england": "Maine coast landscape",
    "US-south": "Louisiana bayou landscape",
    "US-southwest": "New Mexico landscape desert",
    "US-midwest": "Minnesota lake landscape",
    "US-alaska": "Alaska mountain landscape",
    "US-hawaii": "Hawaii coastline landscape",
    "US-california": "San Francisco bay landscape",
    "US": "United States countryside landscape",
    "CA": "Canada landscape mountains",
    "GB": "English countryside landscape",
    "IE": "Ireland countryside landscape",
    "FR": "Brittany coast landscape",
    "NL": "Netherlands polder landscape",
    "BE": "Belgium countryside landscape",
    "SE": "Sweden lake landscape",
    "NO": "Norway fjord landscape",
    "DK": "Denmark countryside landscape",
    "FI": "Finland lake landscape",
    "IS": "Iceland landscape",
    "DE": "Germany countryside landscape",
    "AT": "Austrian Alps landscape",
    "CH": "Switzerland Alps landscape",
    "RU": "Russia countryside landscape",
    "UA": "Ukraine countryside landscape",
    "PL": "Poland countryside landscape",
    "HU": "Hungary countryside landscape",
    "CZ": "Czech countryside landscape",
    "SK": "Slovakia countryside landscape",
    "RO": "Romania countryside landscape",
    "BG": "Bulgaria countryside landscape",
    "RS": "Serbia countryside landscape",
    "HR": "Croatia coast landscape",
    "BY": "Belarus countryside landscape",
    "LT": "Lithuania countryside landscape",
    "LV": "Latvia countryside landscape",
    "EE": "Estonia countryside landscape",
    "AL": "Albania mountains landscape",
    "ES": "Spain countryside landscape",
    "PT": "Portugal coast landscape",
    "IT": "Italy countryside landscape",
    "GR": "Greece coastline landscape",
    "ET": "Ethiopian highlands landscape",
    "ER": "Eritrea landscape",
    "SO": "Somalia landscape coast",
    "SD": "Sudan landscape Nile",
    "MA": "Morocco landscape Atlas",
    "DZ": "Algeria landscape",
    "TN": "Tunisia landscape",
    "EG": "Egypt Nile landscape",
    "NG": "Nigeria landscape",
    "GH": "Ghana coastline landscape",
    "KE": "Kenya landscape savanna",
    "ZM": "Zambia landscape",
    "MG": "Madagascar landscape",
    "ZA": "South Africa landscape",
    "UG": "Uganda landscape",
    "DJ": "Djibouti landscape",
    "YE": "Yemen landscape",
    "AE": "United Arab Emirates desert landscape",
    "TR": "Turkey landscape Cappadocia",
    "IL": "Israel landscape",
    "AF": "Afghanistan mountain landscape",
    "AZ": "Azerbaijan landscape",
    "AM": "Armenia landscape",
    "IR": "Iran landscape",
    "SA": "Saudi Arabia desert landscape",
    "LB": "Lebanon mountain landscape",
    "GE": "Georgia Caucasus landscape",
    "AU": "Australia outback landscape",
    "NZ": "New Zealand landscape",
    "WS": "Samoa coastline landscape",
    "FJ": "Fiji coastline landscape",
    "MU": "Mauritius coastline landscape",
    "IN": "India Western Ghats landscape",
    "LK": "Sri Lanka landscape",
    "BD": "Bangladesh countryside landscape",
    "NP": "Nepal Himalaya landscape",
    "PK": "Pakistan mountain landscape",
    "KR": "South Korea countryside landscape",
    "JP": "Japan countryside landscape",
    "CN": "China countryside landscape",
    "TW": "Taiwan mountain landscape",
    "VN": "Vietnam countryside landscape",
    "TH": "Thailand countryside landscape",
    "MY": "Malaysia landscape",
    "ID": "Indonesia rice terrace landscape",
    "PH": "Philippines coastline landscape",
    "MM": "Myanmar landscape",
    "SG": "Singapore skyline",
    "MX": "Mexico landscape",
    "SV": "El Salvador landscape",
    "CU": "Cuba landscape",
    "JM": "Jamaica coastline landscape",
    "DO": "Dominican Republic coastline landscape",
    "BS": "Bahamas coastline landscape",
    "TT": "Trinidad landscape",
    "PR": "Puerto Rico coastline landscape",
    "HT": "Haiti landscape",
    "MQ": "Martinique coastline landscape",
    "HN": "Honduras landscape",
    "CR": "Costa Rica landscape",
    "NI": "Nicaragua landscape",
    "VE": "Venezuela landscape",
    "CO": "Colombia landscape",
    "BR": "Brazil landscape",
    "AR": "Argentina landscape",
    "CL": "Chile landscape",
    "EC": "Ecuador Andes landscape",
    "PE": "Peru Andes landscape",
    "PY": "Paraguay landscape",
    "UY": "Uruguay countryside landscape",
    "BO": "Bolivia altiplano landscape",
}


def strip_html(value):
    text = re.sub(r"<[^>]+>", "", value or "")
    text = text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&#160;", " ")
    return re.sub(r"\s+", " ", text).strip()


def norm(value):
    value = value.lower()
    value = value.replace("ł", "l").replace("ø", "o").replace("æ", "ae")
    return value


def api(params):
    params = {**params, "format": "json"}
    url = API + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=40) as response:
                return json.load(response)
        except Exception:
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError("commons api failed")


def search(query, limit=8):
    data = api({
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|extmetadata|mime|size",
        "iiurlwidth": "1600",
    })
    pages = (data.get("query") or {}).get("pages") or {}
    found = []
    for page in pages.values():
        info = (page.get("imageinfo") or [None])[0]
        if not info:
            continue
        meta = info.get("extmetadata") or {}
        license_name = strip_html((meta.get("LicenseShortName") or {}).get("value", ""))
        if not license_name or REJECT_LICENSE.search(license_name) or not ALLOWED.search(license_name.strip()):
            continue
        mime = info.get("mime") or ""
        if mime not in {"image/jpeg", "image/png", "image/webp"}:
            continue
        width = info.get("width") or 0
        if width < 500:
            continue
        title = page.get("title", "").replace("File:", "")
        if BAD_TITLE.search(title):
            continue
        artist = strip_html((meta.get("Artist") or {}).get("value", "")) or "Unknown photographer"
        credit = strip_html((meta.get("Credit") or {}).get("value", ""))
        license_url = strip_html((meta.get("LicenseUrl") or {}).get("value", ""))
        description = strip_html((meta.get("ImageDescription") or {}).get("value", ""))
        found.append({
            "title": title,
            "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(page.get("title", "").replace(" ", "_")),
            "thumb": info.get("thumburl") or info.get("url"),
            "mime": mime,
            "width": width,
            "height": info.get("height") or 0,
            "license": license_name,
            "licenseUrl": license_url,
            "artist": artist[:180],
            "credit": credit[:180],
            "description": description[:240],
        })
    time.sleep(0.12)
    return found


def tokens(name):
    words = re.findall(r"[a-z0-9']+", norm(name))
    kept = [word for word in words if word not in GENERIC and word not in PLACE_WORDS and len(word) >= 4]
    return kept


def title_has(title, phrase):
    return norm(phrase) in norm(title)


def pick_dish(pancake):
    override = OVERRIDES.get(pancake["slug"], {})
    query = override.get("q") or pancake["name"]
    must = override.get("must") or tokens(pancake["name"])
    forbid = override.get("forbid") or []
    if not must:
        return None
    hits = search(query)
    for hit in hits:
        title = hit["title"]
        if any(title_has(title, word) for word in forbid):
            continue
        if not any(title_has(title, word) for word in must):
            continue
        blob = title + " " + hit.get("description", "")
        if not FOODISH.search(blob) and not any(title_has(title, word) for word in must if len(word) >= 5):
            continue
        return hit
    return None


def place_key(pancake):
    slug = pancake["slug"]
    blob = " ".join([slug, pancake.get("locale") or "", pancake.get("name") or ""]).lower()
    if pancake["countryCode"] == "US":
        if "appalach" in blob or "hudson" in blob:
            return "US-appalachia"
        if any(word in blob for word in ["rhode", "maine", "vermont", "cape-cod", "new-england"]):
            return "US-new-england"
        if any(word in blob for word in ["mexico", "hopi", "navajo", "piki"]):
            return "US-southwest"
        if "alaska" in blob:
            return "US-alaska"
        if "hawai" in blob:
            return "US-hawaii"
        if any(word in blob for word in ["minnesota", "michigan", "midwest", "swedish"]):
            return "US-midwest"
        if "francisco" in blob:
            return "US-california"
        if any(word in blob for word in ["south", "georgia", "texas", "orleans", "florida", "lowcountry", "hoecake", "corn", "molasses", "banana", "pecan", "peach"]):
            return "US-south"
        return "US"
    return pancake["countryCode"]


def pick_landscape(key):
    query = LANDSCAPE_QUERIES.get(key) or LANDSCAPE_QUERIES.get("US")
    hits = search(query + " -portrait -people", limit=10)
    for hit in hits:
        title = hit["title"]
        if FOODISH.search(title):
            continue
        if re.search(r"\b(person|people|man|woman|child|soldier|wedding|protest|crowd)\b", title, re.I):
            continue
        return hit
    return hits[0] if hits else None


def save_versions(raw, photo_id):
    image = Image.open(BytesIO(raw)).convert("RGB")
    width, height = image.size
    versions = {}
    for target in (480, 800, 1200):
        scale = min(1, target / width)
        resized = image.resize((max(1, int(width * scale)), max(1, int(height * scale))), Image.Resampling.LANCZOS)
        path = OUT_DIR / f"{photo_id}-{target}.webp"
        resized.save(path, "WEBP", quality=68, method=6)
        versions[str(target)] = {
            "src": f"assets/photos/{photo_id}-{target}.webp",
            "width": resized.width,
            "height": resized.height,
        }
    return versions


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def main():
    import subprocess
    raw = subprocess.check_output([
        "node", "--input-type=module", "-e",
        "import { SAUCES } from './data/pancakes/index.js';"
        "process.stdout.write(JSON.stringify(SAUCES.map(p => ({slug:p.slug,name:p.name,country:p.country,countryCode:p.countryCode,region:p.region,locale:p.locale||''}))));"
    ], cwd=ROOT)
    pancakes = json.loads(raw)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    landscapes = {}
    photos = {}
    assignments = {}
    dish_count = 0
    for pancake in pancakes:
        hit = pick_dish(pancake)
        kind = "dish"
        if not hit:
            key = place_key(pancake)
            if key not in landscapes:
                landscapes[key] = pick_landscape(key)
            hit = landscapes[key]
            kind = "place"
        if not hit:
            print("NO PHOTO", pancake["slug"])
            continue
        photo_id = re.sub(r"[^a-z0-9]+", "-", norm(hit["title"])).strip("-")[:80]
        if photo_id not in photos:
            print("download", kind, pancake["slug"], "<-", hit["title"])
            blob = download(hit["thumb"])
            versions = save_versions(blob, photo_id)
            photos[photo_id] = {
                "id": photo_id,
                "title": hit["title"],
                "page": hit["page"],
                "artist": hit["artist"],
                "license": hit["license"],
                "licenseUrl": hit["licenseUrl"],
                "versions": versions,
            }
        else:
            print("reuse", kind, pancake["slug"], "<-", hit["title"])
        if kind == "dish":
            alt = f"{pancake['name']}, the dish named on this page."
            label = "Photograph of the dish."
            dish_count += 1
        else:
            place = pancake.get("locale") or pancake["country"]
            alt = f"Landscape of {place}. This photograph shows the place, not the pancake."
            label = f"Photograph of the place ({place}), not the dish."
        assignments[pancake["slug"]] = {
            "photoId": photo_id,
            "kind": kind,
            "alt": alt,
            "label": label,
        }
    manifest = {
        "photos": photos,
        "assignments": assignments,
        "dishCount": dish_count,
        "placeCount": len(assignments) - dish_count,
        "uniqueCount": len(photos),
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2))
    print(f"dishes {dish_count} places {manifest['placeCount']} unique {len(photos)}")


if __name__ == "__main__":
    main()
