Quick setup

1. Create a Python virtual environment and activate it.

Windows (PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Initialize the database (optional - `app.py` will auto-init on first run):

```powershell
python database_setup.py
```

3. Run the Flask app:

```powershell
python app.py
```

4. Open http://127.0.0.1:5000/ in your browser to view the site.
