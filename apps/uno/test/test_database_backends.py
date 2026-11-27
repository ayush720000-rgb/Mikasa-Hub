import json
import os
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from unittest import mock

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, ROOT)
os.environ.setdefault('TOKEN', '123456:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef')
os.environ.setdefault('PORT', '')

import database  # noqa: E402
import user_setting  # noqa: E402


class FileBackendTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.path = os.path.join(self.dir, 'uno-data.json')
        self.original = database._backend

    def tearDown(self):
        database._backend = self.original

    def bind_file(self):
        database._backend = database.FileStore(self.path)

    def test_new_player_reads_as_zeros(self):
        self.bind_file()
        self.assertEqual(user_setting.get_stats(42), {'games_played': 0, 'first_places': 0, 'cards_played': 0})

    def test_counters_add_up_and_survive_a_restart(self):
        self.bind_file()
        user_setting.add_stats(42, cards_played=1)
        user_setting.add_stats(42, cards_played=1, games_played=1, first_places=1)
        user_setting.add_stats(42, games_played=1, first_places=0)
        self.bind_file()  # a fresh store reads the same file
        self.assertEqual(user_setting.get_stats(42), {'games_played': 2, 'first_places': 1, 'cards_played': 2})

    def test_players_are_kept_apart(self):
        self.bind_file()
        user_setting.add_stats(1, cards_played=3)
        self.assertEqual(user_setting.get_stats(2)['cards_played'], 0)

    def test_unknown_counter_is_refused(self):
        self.bind_file()
        with self.assertRaises(KeyError):
            user_setting.add_stats(1, not_a_counter=1)

    def test_concurrent_updates_are_never_lost(self):
        self.bind_file()
        workers, per_worker = 8, 50
        def bump(_):
            for _ in range(per_worker):
                user_setting.add_stats(7, cards_played=1)
        with ThreadPoolExecutor(max_workers=workers) as pool:
            list(pool.map(bump, range(workers)))
        self.assertEqual(user_setting.get_stats(7)['cards_played'], workers * per_worker)

    def test_file_is_plain_json_and_is_written_atomically(self):
        self.bind_file()
        user_setting.add_stats(5, games_played=1)
        with open(self.path, encoding='utf-8') as handle:
            self.assertEqual(json.load(handle), {'5': {'games_played': 1}})
        leftovers = [n for n in os.listdir(self.dir) if n.endswith('.tmp')]
        self.assertEqual(leftovers, [])

    def test_unreadable_file_starts_empty(self):
        with open(self.path, 'w', encoding='utf-8') as handle:
            handle.write('{not json')
        self.bind_file()
        self.assertEqual(user_setting.get_stats(1)['cards_played'], 0)

    def test_file_size_counts_the_json_file(self):
        with open(self.path, 'wb') as handle:
            handle.write(b'a' * 1000)
        self.bind_file()
        self.assertEqual(database.database_size_bytes(), 1000)


class MongoBackendTests(unittest.TestCase):
    def setUp(self):
        self.original = database._backend
        self.collection = mock.MagicMock()
        self.store = database.MongoStore.__new__(database.MongoStore)
        self.store.db = mock.MagicMock()
        self.store.collection = self.collection
        database._backend = self.store

    def tearDown(self):
        database._backend = self.original

    def test_counters_are_sent_as_one_atomic_increment_with_upsert(self):
        user_setting.add_stats(99, cards_played=2, games_played=1)
        self.collection.update_one.assert_called_once_with(
            {'_id': 99}, {'$inc': {'cards_played': 2, 'games_played': 1}}, upsert=True)

    def test_zero_amounts_send_nothing(self):
        user_setting.add_stats(99, cards_played=0, first_places=0)
        self.collection.update_one.assert_not_called()

    def test_reads_fill_in_missing_counters_with_zero(self):
        self.collection.find_one.return_value = {'cards_played': 4}
        self.assertEqual(user_setting.get_stats(99), {'games_played': 0, 'first_places': 0, 'cards_played': 4})
        self.collection.find_one.assert_called_once_with({'_id': 99}, {'_id': 0})

    def test_size_is_data_plus_index_storage_from_dbstats(self):
        self.store.db.command.return_value = {'storageSize': 9_000_000, 'indexSize': 1_000_000}
        self.assertEqual(database.database_size_bytes(), 10_000_000)
        self.store.db.command.assert_called_once_with('dbStats')


class UnboundDatabaseTests(unittest.TestCase):
    def test_size_is_zero_before_binding(self):
        original = database._backend
        database._backend = None
        try:
            self.assertEqual(database.database_size_bytes(), 0)
        finally:
            database._backend = original

    def test_counters_refuse_to_run_before_binding(self):
        original = database._backend
        database._backend = None
        try:
            with self.assertRaises(RuntimeError):
                user_setting.get_stats(1)
        finally:
            database._backend = original


if __name__ == '__main__':
    unittest.main()
