# AutoTrace AI

Intelligent FTTP (Fiber to the Premises) cost estimation and governance system.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run server:
```bash
uvicorn app.main:app --reload
```
