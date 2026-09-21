export const restaurant = {
  name: 'Ember & Sage',
  tagline: 'Modern hearth cooking, seasonal plates, and a wood-fired kitchen you can watch work.',
  address: '48 Nguyen Hue, District 1, Ho Chi Minh City',
  hours: 'Tue–Sun, 17:00–23:00 (closed Mondays)',
};

export interface MenuItem {
  id: string;
  category: 'Starters' | 'Mains' | 'Desserts' | 'Bar';
  title: string;
  description: string;
  price: number; // VND
}

export const menu: MenuItem[] = [
  { id: 'starter-1', category: 'Starters', title: 'Roasted Beet & Burrata Salad', description: 'Heirloom beets, whipped burrata, toasted hazelnut, aged balsamic', price: 145000 },
  { id: 'starter-2', category: 'Starters', title: 'Charred Octopus', description: 'Smoked paprika aioli, fingerling potato, chili oil', price: 185000 },
  { id: 'starter-3', category: 'Starters', title: 'Wild Mushroom Toast', description: 'Sourdough, whipped ricotta, thyme, brown butter', price: 120000 },
  { id: 'main-1', category: 'Mains', title: 'Herb-Crusted Lamb Rack', description: 'Rosemary jus, roasted root vegetables, potato gratin', price: 385000 },
  { id: 'main-2', category: 'Mains', title: 'Pan-Seared Duck Breast', description: 'Cherry reduction, celeriac puree, charred endive', price: 320000 },
  { id: 'main-3', category: 'Mains', title: 'Slow-Braised Short Rib', description: '18-hour braise, red wine jus, parsnip mash', price: 350000 },
  { id: 'main-4', category: 'Mains', title: 'Charcoal Grilled Sea Bass', description: 'Citrus butter, fennel salad, chili crisp', price: 295000 },
  { id: 'dessert-1', category: 'Desserts', title: 'Dark Chocolate Fondant', description: 'Molten center, salted caramel, vanilla bean ice cream', price: 95000 },
  { id: 'dessert-2', category: 'Desserts', title: 'Burnt Honey Panna Cotta', description: 'Toasted almond, seasonal berries', price: 85000 },
  { id: 'bar-1', category: 'Bar', title: 'House Spiced Old Fashioned', description: 'Bourbon, cardamom syrup, orange bitters', price: 165000 },
  { id: 'bar-2', category: 'Bar', title: 'Smoked Rosemary Lemonade', description: 'Non-alcoholic, fresh lemon, rosemary smoke', price: 65000 },
];

export const CATEGORIES: Array<MenuItem['category']> = ['Starters', 'Mains', 'Desserts', 'Bar'];
