<?php
class DB
{
	private $db;

	public function __construct()
	{
		$this->db = new PDO('sqlite:database.db');
		$this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		$this->initTables();
		$this->insertSampleData();
	}

	private function initTables()
	{
		// Таблица Сделки
		$this->db->exec("
            CREATE TABLE IF NOT EXISTS deals (
                deal_id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                price DECIMAL(10, 2) DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

		// Таблица Контакты
		$this->db->exec("
            CREATE TABLE IF NOT EXISTS contacts (
                contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");

		// Связующая таблика (многие-ко-многим)
		$this->db->exec("
            CREATE TABLE IF NOT EXISTS deal_contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                deal_id INTEGER,
                contact_id INTEGER,
                FOREIGN KEY (deal_id) REFERENCES deals (deal_id) ON DELETE CASCADE,
                FOREIGN KEY (contact_id) REFERENCES contacts (contact_id) ON DELETE CASCADE,
                UNIQUE(deal_id, contact_id)
            )
        ");
	}

	private function insertSampleData()
	{
		// Проверяем, есть ли уже данные
		$stmt = $this->db->query("SELECT COUNT(*) FROM deals");
		if ($stmt->fetchColumn() == 0) {
			// Добавляем тестовые сделки
			$this->db->exec("
                INSERT INTO deals (title, price, status) VALUES 
                ('Хотят люстру', 4000, 'active'),
                ('Хотят светильник', 2500, 'active'), 
                ('Пока думают', 1500, 'active')
            ");

			// Добавляем тестовые контакты
			$this->db->exec("
                INSERT INTO contacts (first_name, last_name, email) VALUES 
                ('Василий', 'Иванов', 'vasily@mail.com'),
                ('Иван', 'Петров', 'ivan@mail.com'),
                ('Наталья', 'Сидорова', 'natalya@mail.com')
            ");

			// Создаем связи
			$this->db->exec("
                INSERT INTO deal_contacts (deal_id, contact_id) VALUES 
                (1, 1), (1, 2), (2, 3), (3, 1)
            ");
		}
	}

	// Методы для работы со сделками
	public function getDeals()
	{
		$stmt = $this->db->query("
            SELECT d.*, 
                   GROUP_CONCAT(c.contact_id) as contact_ids,
                   GROUP_CONCAT(c.first_name || ' ' || c.last_name) as contact_names
            FROM deals d
            LEFT JOIN deal_contacts dc ON d.deal_id = dc.deal_id
            LEFT JOIN contacts c ON dc.contact_id = c.contact_id
            GROUP BY d.deal_id
            ORDER BY d.created_at DESC
        ");
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	public function getDeal($id)
	{
		$stmt = $this->db->prepare("
            SELECT d.*, 
                   GROUP_CONCAT(c.contact_id) as contact_ids,
                   GROUP_CONCAT(c.first_name || ' ' || c.last_name) as contact_names
            FROM deals d
            LEFT JOIN deal_contacts dc ON d.deal_id = dc.deal_id
            LEFT JOIN contacts c ON dc.contact_id = c.contact_id
            WHERE d.deal_id = ?
            GROUP BY d.deal_id
        ");
		$stmt->execute([$id]);
		return $stmt->fetch(PDO::FETCH_ASSOC);
	}

	public function addDeal($title, $price, $contactIds = [])
	{
		$this->db->beginTransaction();

		try {
			// Добавляем сделку
			$stmt = $this->db->prepare("
                INSERT INTO deals (title, price) VALUES (?, ?)
            ");
			$stmt->execute([$title, $price]);
			$dealId = $this->db->lastInsertId();

			// Добавляем связи с контактами
			if (!empty($contactIds)) {
				$stmt = $this->db->prepare("
                    INSERT INTO deal_contacts (deal_id, contact_id) VALUES (?, ?)
                ");
				foreach ($contactIds as $contactId) {
					$stmt->execute([$dealId, $contactId]);
				}
			}

			$this->db->commit();
			return $dealId;
		} catch (Exception $e) {
			$this->db->rollBack();
			throw $e;
		}
	}

	public function updateDeal($id, $title, $price, $contactIds = [])
	{
		$this->db->beginTransaction();

		try {
			// Обновляем сделку
			$stmt = $this->db->prepare("
                UPDATE deals SET title = ?, price = ? WHERE deal_id = ?
            ");
			$stmt->execute([$title, $price, $id]);

			// Удаляем старые связи
			$stmt = $this->db->prepare("
                DELETE FROM deal_contacts WHERE deal_id = ?
            ");
			$stmt->execute([$id]);

			// Добавляем новые связи
			if (!empty($contactIds)) {
				$stmt = $this->db->prepare("
                    INSERT INTO deal_contacts (deal_id, contact_id) VALUES (?, ?)
                ");
				foreach ($contactIds as $contactId) {
					$stmt->execute([$id, $contactId]);
				}
			}

			$this->db->commit();
			return true;
		} catch (Exception $e) {
			$this->db->rollBack();
			throw $e;
		}
	}

	public function deleteDeal($id)
	{
		$stmt = $this->db->prepare("DELETE FROM deals WHERE deal_id = ?");
		return $stmt->execute([$id]);
	}

	// Методы для работы с контактами
	public function getContacts()
	{
		$stmt = $this->db->query("
            SELECT c.*, 
                   GROUP_CONCAT(d.deal_id) as deal_ids,
                   GROUP_CONCAT(d.title) as deal_titles
            FROM contacts c
            LEFT JOIN deal_contacts dc ON c.contact_id = dc.contact_id
            LEFT JOIN deals d ON dc.deal_id = d.deal_id
            GROUP BY c.contact_id
            ORDER BY c.created_at DESC
        ");
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	public function getContact($id)
	{
		$stmt = $this->db->prepare("
            SELECT c.*, 
                   GROUP_CONCAT(d.deal_id) as deal_ids,
                   GROUP_CONCAT(d.title) as deal_titles
            FROM contacts c
            LEFT JOIN deal_contacts dc ON c.contact_id = dc.contact_id
            LEFT JOIN deals d ON dc.deal_id = d.deal_id
            WHERE c.contact_id = ?
            GROUP BY c.contact_id
        ");
		$stmt->execute([$id]);
		return $stmt->fetch(PDO::FETCH_ASSOC);
	}

	public function addContact($firstName, $lastName, $email, $phone, $dealIds = [])
	{
		$this->db->beginTransaction();

		try {
			// Добавляем контакт
			$stmt = $this->db->prepare("
                INSERT INTO contacts (first_name, last_name, email, phone) 
                VALUES (?, ?, ?, ?)
            ");
			$stmt->execute([$firstName, $lastName, $email, $phone]);
			$contactId = $this->db->lastInsertId();

			// Добавляем связи со сделками
			if (!empty($dealIds)) {
				$stmt = $this->db->prepare("
                    INSERT INTO deal_contacts (deal_id, contact_id) VALUES (?, ?)
                ");
				foreach ($dealIds as $dealId) {
					$stmt->execute([$dealId, $contactId]);
				}
			}

			$this->db->commit();
			return $contactId;
		} catch (Exception $e) {
			$this->db->rollBack();
			throw $e;
		}
	}

	public function updateContact($id, $firstName, $lastName, $email, $phone, $dealIds = [])
	{
		$this->db->beginTransaction();

		try {
			// Обновляем контакт
			$stmt = $this->db->prepare("
                UPDATE contacts 
                SET first_name = ?, last_name = ?, email = ?, phone = ? 
                WHERE contact_id = ?
            ");
			$stmt->execute([$firstName, $lastName, $email, $phone, $id]);

			// Удаляем старые связи
			$stmt = $this->db->prepare("
                DELETE FROM deal_contacts WHERE contact_id = ?
            ");
			$stmt->execute([$id]);

			// Добавляем новые связи
			if (!empty($dealIds)) {
				$stmt = $this->db->prepare("
                    INSERT INTO deal_contacts (deal_id, contact_id) VALUES (?, ?)
                ");
				foreach ($dealIds as $dealId) {
					$stmt->execute([$dealId, $id]);
				}
			}

			$this->db->commit();
			return true;
		} catch (Exception $e) {
			$this->db->rollBack();
			throw $e;
		}
	}

	public function deleteContact($id)
	{
		$stmt = $this->db->prepare("DELETE FROM contacts WHERE contact_id = ?");
		return $stmt->execute([$id]);
	}

	// Вспомогательные методы
	public function getAllContactsForSelect()
	{
		$stmt = $this->db->query("
            SELECT contact_id, first_name || ' ' || last_name as name 
            FROM contacts 
            ORDER BY first_name, last_name
        ");
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}

	public function getAllDealsForSelect()
	{
		$stmt = $this->db->query("
            SELECT deal_id, title 
            FROM deals 
            ORDER BY title
        ");
		return $stmt->fetchAll(PDO::FETCH_ASSOC);
	}
}
