// Utilidad para búsqueda y asignación de imágenes de perfumes según la marca y fragancia
export interface ImagenPerfume {
  marca: string;
  nombre: string;
  url: string;
}

export const CATALOGO_IMAGENES_PERFUMES: ImagenPerfume[] = [
  // Carolina Herrera
  {
    marca: 'Carolina Herrera',
    nombre: 'Good Girl Eau de Parfum',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Carolina Herrera',
    nombre: '212 VIP Rosé / 212 Sexy',
    url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Carolina Herrera',
    nombre: 'Bad Boy Eau de Toilette',
    url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80'
  },
  // Dior
  {
    marca: 'Dior',
    nombre: 'Sauvage Christian Dior',
    url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Dior',
    nombre: 'J\'adore / Miss Dior',
    url: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=500&q=80'
  },
  // Chanel
  {
    marca: 'Chanel',
    nombre: 'Chanel N°5 / Coco Mademoiselle',
    url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Chanel',
    nombre: 'Bleu de Chanel',
    url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=500&q=80'
  },
  // Paco Rabanne
  {
    marca: 'Paco Rabanne',
    nombre: '1 Million Gold / Parfum',
    url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Paco Rabanne',
    nombre: 'Invictus / Olympéa',
    url: 'https://images.unsplash.com/photo-1583445013765-46c20c4a6772?auto=format&fit=crop&w=500&q=80'
  },
  // Versace
  {
    marca: 'Versace',
    nombre: 'Eros Pour Homme / Dylan Blue',
    url: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Versace',
    nombre: 'Bright Crystal / Crystal Noir',
    url: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=500&q=80'
  },
  // Victoria's Secret
  {
    marca: 'Victoria\'s Secret',
    nombre: 'Bombshell Eau de Parfum',
    url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Victoria\'s Secret',
    nombre: 'Pure Seduction / Velvet Petals Splash',
    url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Victoria\'s Secret',
    nombre: 'Bare Vanilla / Coconut Passion',
    url: 'https://images.unsplash.com/photo-1608248597358-1f558b3874c2?auto=format&fit=crop&w=500&q=80'
  },
  // Bath & Body Works
  {
    marca: 'Bath & Body Works',
    nombre: 'Fragrance Mist & Body Cream',
    url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Bath & Body Works',
    nombre: 'Warm Vanilla Sugar / In The Stars',
    url: 'https://images.unsplash.com/photo-1570554886111-e80fcca6a029?auto=format&fit=crop&w=500&q=80'
  },
  // Dolce & Gabbana
  {
    marca: 'Dolce & Gabbana',
    nombre: 'Light Blue Eau de Toilette',
    url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Dolce & Gabbana',
    nombre: 'The One for Men / Women',
    url: 'https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=500&q=80'
  },
  // Jean Paul Gaultier
  {
    marca: 'Jean Paul Gaultier',
    nombre: 'Le Male / Scandal',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80'
  },
  // Calvin Klein
  {
    marca: 'Calvin Klein',
    nombre: 'CK One / Euphoria',
    url: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=500&q=80'
  },
  // Yves Saint Laurent
  {
    marca: 'Yves Saint Laurent',
    nombre: 'Libre / Black Opium / Y',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80'
  },
  // Lancôme
  {
    marca: 'Lancôme',
    nombre: 'La Vie Est Belle / Idôle',
    url: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=500&q=80'
  },
  // Giorgio Armani
  {
    marca: 'Giorgio Armani',
    nombre: 'Acqua Di Gio / Sí',
    url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80'
  },
  // Hugo Boss
  {
    marca: 'Hugo Boss',
    nombre: 'Boss Bottled / The Scent',
    url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=500&q=80'
  },
  // Guess
  {
    marca: 'Guess',
    nombre: 'Guess Seductive / Bella Vita',
    url: 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=500&q=80'
  },
  // Ariana Grande
  {
    marca: 'Ariana Grande',
    nombre: 'Cloud / Sweet Like Candy',
    url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=500&q=80'
  },
  // Perfume Genérico / De Lujo
  {
    marca: 'Perfumería Fina',
    nombre: 'Fragancia y Perfume Exclusivo',
    url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80'
  },
  {
    marca: 'Cosméticos y Cremas',
    nombre: 'Cremas, Lociones y Cuidado Personal',
    url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=500&q=80'
  }
];

export const MARCAS_PERFUMES_POPULARES = [
  'Carolina Herrera',
  'Dior',
  'Chanel',
  'Paco Rabanne',
  'Versace',
  'Victoria\'s Secret',
  'Bath & Body Works',
  'Dolce & Gabbana',
  'Jean Paul Gaultier',
  'Calvin Klein',
  'Yves Saint Laurent',
  'Lancôme',
  'Giorgio Armani',
  'Hugo Boss',
  'Guess',
  'Ariana Grande',
  'Tom Ford',
  'Gucci',
  'Burberry',
  'Lacoste',
  'Nautica',
  'Perry Ellis',
  'Montblanc',
  'Moschino',
  'Ralph Lauren'
];

/**
 * Busca imágenes en el catálogo según la marca y/o el nombre del perfume
 */
export function buscarImagenesPorMarca(marcaOTermino: string): ImagenPerfume[] {
  if (!marcaOTermino || !marcaOTermino.trim()) {
    return CATALOGO_IMAGENES_PERFUMES.slice(0, 8);
  }

  const limpio = marcaOTermino.toLowerCase().trim();

  // Búsqueda por coincidencia exacta o parcial en marca o nombre
  const coincidencias = CATALOGO_IMAGENES_PERFUMES.filter(p => 
    p.marca.toLowerCase().includes(limpio) || 
    limpio.includes(p.marca.toLowerCase()) ||
    p.nombre.toLowerCase().includes(limpio)
  );

  if (coincidencias.length > 0) {
    return coincidencias;
  }

  // Si no hay directa, devolver una lista variada de perfumes populares
  return CATALOGO_IMAGENES_PERFUMES.slice(0, 6);
}

/**
 * Retorna la mejor imagen automática sugerida según la marca y el nombre del perfume
 */
export function obtenerImagenSugerida(marca: string, nombreProducto?: string): string {
  const buscar = `${marca || ''} ${nombreProducto || ''}`.toLowerCase().trim();

  if (buscar.includes('carolina') || buscar.includes('herrera') || buscar.includes('good girl') || buscar.includes('212') || buscar.includes('bad boy')) {
    return CATALOGO_IMAGENES_PERFUMES[0].url;
  }
  if (buscar.includes('dior') || buscar.includes('sauvage') || buscar.includes('jadore')) {
    return CATALOGO_IMAGENES_PERFUMES[3].url;
  }
  if (buscar.includes('chanel') || buscar.includes('coco') || buscar.includes('bleu')) {
    return CATALOGO_IMAGENES_PERFUMES[5].url;
  }
  if (buscar.includes('paco') || buscar.includes('rabanne') || buscar.includes('million') || buscar.includes('invictus') || buscar.includes('olympea')) {
    return CATALOGO_IMAGENES_PERFUMES[7].url;
  }
  if (buscar.includes('versace') || buscar.includes('eros') || buscar.includes('bright crystal')) {
    return CATALOGO_IMAGENES_PERFUMES[9].url;
  }
  if (buscar.includes('victoria') || buscar.includes('secret') || buscar.includes('bombshell') || buscar.includes('splash')) {
    return CATALOGO_IMAGENES_PERFUMES[11].url;
  }
  if (buscar.includes('bath') || buscar.includes('body') || buscar.includes('crema') || buscar.includes('locion')) {
    return CATALOGO_IMAGENES_PERFUMES[14].url;
  }
  if (buscar.includes('dolce') || buscar.includes('gabbana') || buscar.includes('light blue')) {
    return CATALOGO_IMAGENES_PERFUMES[16].url;
  }
  if (buscar.includes('gaultier') || buscar.includes('male') || buscar.includes('scandal')) {
    return CATALOGO_IMAGENES_PERFUMES[18].url;
  }
  if (buscar.includes('calvin') || buscar.includes('klein') || buscar.includes('ck')) {
    return CATALOGO_IMAGENES_PERFUMES[19].url;
  }
  if (buscar.includes('yves') || buscar.includes('laurent') || buscar.includes('ysl') || buscar.includes('libre')) {
    return CATALOGO_IMAGENES_PERFUMES[20].url;
  }
  if (buscar.includes('lancome') || buscar.includes('vie est belle')) {
    return CATALOGO_IMAGENES_PERFUMES[21].url;
  }
  if (buscar.includes('armani') || buscar.includes('acqua')) {
    return CATALOGO_IMAGENES_PERFUMES[22].url;
  }
  if (buscar.includes('boss') || buscar.includes('hugo')) {
    return CATALOGO_IMAGENES_PERFUMES[23].url;
  }
  if (buscar.includes('guess')) {
    return CATALOGO_IMAGENES_PERFUMES[24].url;
  }
  if (buscar.includes('ariana')) {
    return CATALOGO_IMAGENES_PERFUMES[25].url;
  }

  // Default perfume de lujo
  return CATALOGO_IMAGENES_PERFUMES[0].url;
}
