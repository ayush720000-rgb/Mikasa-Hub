#!/usr/bin/env python3
# -*- coding: utf-8 -*-


from config import TOKEN, WORKERS
from telegram.ext import Application

from game_manager import GameManager
from database import bind_database
from start_bot import post_init

if not TOKEN:
    raise SystemExit(
        "TOKEN is not set. Get a token from @BotFather and set it as the "
        "TOKEN environment variable (on Render: Environment tab -> TOKEN).")

bind_database()

gm = GameManager()
# Handlers are registered on this Application by the modules imported below.
# post_init (start_bot.post_init) runs on the event loop before polling starts.
application = (Application.builder().token(TOKEN).concurrent_updates(WORKERS)
               .post_init(post_init).build())
