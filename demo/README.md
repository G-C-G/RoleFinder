# Live demo (example data)

`GCG-Game-Plan-live-demo.mp4` is a recording of the real Game Plan app with a fictional team (Ama, Kofi, Yaw, Efua, Selorm) and a fictional company. Everything on screen is labelled EXAMPLE DATA.

- `real_wrap.html`: the frame (two phones plus the five steps from the deck).
- `tools/seed_fake.js`: the fictional team, six months of finished work and titles.
- `tools/real_record.js`: the scripted run that records the video (needs Playwright and the mock database in `tools/mock_db_t2.js`).
- `engine.js`: a prototype allocation engine using six-month records. It is not part of the app yet.
