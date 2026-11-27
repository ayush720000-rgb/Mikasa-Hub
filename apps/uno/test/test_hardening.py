import importlib
import logging
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class CardPackTests(unittest.TestCase):
    def test_default_pack_is_used_when_unset(self):
        import card
        self.assertIs(card._select_card_pack(None), card.CARD_PACKS[card.DEFAULT_CARD_PACK])

    def test_unknown_pack_falls_back_with_warning(self):
        import card
        with self.assertLogs("card", level=logging.WARNING) as logs:
            pack = card._select_card_pack("does-not-exist")
        self.assertIs(pack, card.CARD_PACKS[card.DEFAULT_CARD_PACK])
        self.assertIn("Unknown CARD_PACK", logs.output[0])

    def test_sticker_maps_come_from_the_active_pack(self):
        import card
        self.assertEqual(card.STICKERS["y_skip"], card._active_pack["normal"]["y_skip"])


class OwnerButtonTests(unittest.TestCase):
    def test_owner_button_is_red_and_links_to_owner(self):
        import simple_commands
        markup = simple_commands._about_keyboard()
        button = markup.inline_keyboard[0][0]
        self.assertEqual(button.text, "Owner")
        self.assertEqual(button.url, "https://t.me/Sexiest_Banda")
        self.assertEqual(button.to_dict().get("style"), "danger")

    def test_about_mentions_main_bot_sister_in_its_own_blockquote(self):
        import simple_commands
        bot = mock.MagicMock(first_name="UNO")
        text = simple_commands._about_text(bot)
        self.assertIn("<blockquote>Sister of the main bot @Ig_MikasaBot</blockquote>", text)
        self.assertTrue(text.index("Sister of the main bot") > text.index("Live status with /ping"))



class DatabaseFallbackTests(unittest.TestCase):
    def _bind(self, env, ping_error=None):
        """Bind with a fake MongoDB whose ping either works or raises ping_error."""
        import database
        importlib.reload(database)
        client = mock.MagicMock()
        client.admin.command.side_effect = ping_error
        with mock.patch.dict(os.environ, env, clear=False), \
             mock.patch("database.MongoClient", return_value=client) as make_client:
            database.bind_database()
        return database, make_client

    def test_unreachable_mongo_falls_back_to_file_and_logs_persistence_warning(self):
        from pymongo.errors import ServerSelectionTimeoutError
        path = os.path.join(tempfile.mkdtemp(), "x.json")
        with self.assertLogs("database", level=logging.WARNING) as logs:
            database, _ = self._bind({"MONGODB_URI": "mongodb://h/db", "UNO_DB": path},
                                     ping_error=ServerSelectionTimeoutError("down"))
        self.assertEqual(database.get_backend().kind, "file")
        self.assertEqual(database.get_backend().path, path)
        self.assertTrue(any("lost on every redeploy" in m for m in logs.output))

    def test_require_database_refuses_file_fallback(self):
        from pymongo.errors import ServerSelectionTimeoutError
        with self.assertRaises(RuntimeError):
            self._bind({"MONGODB_URI": "mongodb://h/db", "UNO_REQUIRE_DATABASE": "true"},
                       ping_error=ServerSelectionTimeoutError("down"))

    def test_unexpected_errors_are_not_swallowed(self):
        with self.assertRaises(KeyError):
            self._bind({"MONGODB_URI": "mongodb://h/db"}, ping_error=KeyError("bug"))

    def test_working_mongo_is_used_without_a_file(self):
        database, make_client = self._bind({"MONGODB_URI": "mongodb://h/db", "MONGODB_DB": "uno_test"})
        self.assertEqual(database.get_backend().kind, "mongodb")
        make_client.assert_called_once()
        self.assertEqual(make_client.call_args.args[0], "mongodb://h/db")


class BackgroundErrorTests(unittest.TestCase):
    def test_unexpected_exception_is_logged_with_traceback(self):
        import bridge
        def boom():
            raise ValueError("real bug")
        import time
        from concurrent.futures import wait
        with self.assertLogs("bridge", level=logging.ERROR) as logs:
            future = bridge.run_in_background(boom)
            wait([future])  # wait without .result(), which would re-raise the error here
            # Waiters wake before done-callbacks run, so poll briefly for the logged line.
            deadline = time.monotonic() + 2
            while not any("Background call failed" in m for m in logs.output) and time.monotonic() < deadline:
                time.sleep(0.01)
        self.assertTrue(any("Background call failed" in m for m in logs.output))

    def test_telegram_errors_are_warnings_not_errors(self):
        import bridge
        from telegram.error import NetworkError
        def flaky():
            raise NetworkError("temporary")
        from concurrent.futures import wait
        with self.assertLogs("bridge", level=logging.WARNING) as logs:
            wait([bridge.run_in_background(flaky)])
        self.assertTrue(any("Telegram call failed" in m for m in logs.output))


if __name__ == "__main__":
    unittest.main()
