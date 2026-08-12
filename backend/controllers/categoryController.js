const db = require('../config/database');

// Get all categories
exports.getCategories = (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, COUNT(q.id) as quiz_count 
      FROM categories c 
      LEFT JOIN quizzes q ON c.id = q.category_id 
      GROUP BY c.id 
      ORDER BY c.name ASC
    `).all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};

// Create category [Admin]
exports.createCategory = (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = db.prepare('SELECT id FROM categories WHERE name = ?').get(name.trim());
    if (existing) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const stmt = db.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)');
    const result = stmt.run(name.trim(), description || '', icon || 'Code');

    if (db.saveBackup) db.saveBackup();

    const newCategory = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
};

// Update category [Admin]
exports.updateCategory = (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon } = req.body;

    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) {
      const existing = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(name.trim(), id);
      if (existing) {
        return res.status(400).json({ message: 'Category name already taken by another category' });
      }
    }

    db.prepare('UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description), icon = COALESCE(?, icon) WHERE id = ?')
      .run(name ? name.trim() : null, description, icon, id);

    if (db.saveBackup) db.saveBackup();

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
};

// Delete category [Admin]
exports.deleteCategory = (req, res) => {
  try {
    const { id } = req.params;
    const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    if (db.saveBackup) db.saveBackup();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
};
