#!/usr/bin/env python3
"""Builds web/index.html: the existing Game Plan page plus the Supabase layer."""
import os, sys
here = os.path.dirname(os.path.abspath(__file__))
app = open(os.path.join(here, "..", "gcg-game-plan.html"), encoding="utf-8").read()
shim = open(os.path.join(here, "shim.js"), encoding="utf-8").read()
cfg_path = os.path.join(here, "config.js")
cfg = open(cfg_path, encoding="utf-8").read() if os.path.exists(cfg_path) else open(os.path.join(here, "config.example.js"), encoding="utf-8").read()
logo = ""
head = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>\n'
        '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>\n'
        '<script>' + cfg + '</script>\n<script>' + shim + '</script>\n')
open(os.path.join(here, "index.html"), "w", encoding="utf-8").write(head + app + "\n</body></html>\n")
print("built web/index.html", len(head + app), "bytes")
