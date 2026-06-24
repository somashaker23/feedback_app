from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
import json
import uvicorn


# --- 1. PYDANTIC MODEL ---
# Name is optional now to protect anonymity
class FeedbackInput(BaseModel):
    name: str | None = Field(None, max_length=50, description="Optional name of the user")
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: str = Field(..., min_length=2, max_length=1000, description="Feedback comment")


app = FastAPI(title="Farewell Feedback")
FEEDBACK_FILE = "feedback_data.json"

# --- 2. WARM & ANONYMOUS HTML FRONTEND ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A Note for You</title>
    <style>
        body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f7f6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .card {
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            text-align: center;
        }
        h2 {
            color: #2c3e50;
            font-size: 24px;
            margin-bottom: 5px;
        }
        p.subtitle {
            color: #7f8c8d;
            font-size: 15px;
            margin-bottom: 30px;
        }
        .form-group {
            text-align: left;
            margin-bottom: 25px;
        }
        label {
            display: block;
            font-weight: 600;
            margin-bottom: 8px;
            color: #34495e;
        }
        textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-family: inherit;
            font-size: 15px;
            resize: vertical;
            box-sizing: border-box;
            transition: border-color 0.3s;
        }
        textarea:focus {
            outline: none;
            border-color: #3498db;
        }

        /* Star Rating Styling */
        .star-group {
            text-align: center;
            margin: 20px 0 30px 0;
        }
        .stars {
            display: inline-block;
            direction: rtl;
        }
        .stars input { display: none; }
        .stars label {
            font-size: 40px;
            color: #e0e0e0;
            cursor: pointer;
            margin: 0 5px;
            transition: color 0.2s, transform 0.2s;
        }
        .stars label:hover,
        .stars label:hover ~ label,
        .stars input:checked ~ label {
            color: #f1c40f;
            transform: scale(1.1);
        }

        /* Optional Name Toggle */
        .optional-name {
            margin-bottom: 25px;
            font-size: 14px;
            color: #95a5a6;
        }
        .optional-name input {
            margin-top: 8px;
            padding: 8px;
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #ddd;
            border-radius: 6px;
            display: none;
        }

        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 14px 28px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            width: 100%;
            transition: background 0.3s;
        }
        button:hover { background-color: #2980b9; }

        /* Success State */
        #success-state { display: none; }
        .success-icon { font-size: 50px; margin-bottom: 15px; }
        .success-text { color: #27ae60; font-size: 18px; font-weight: bold; }

        /* Privacy Note */
        .privacy-note {
            margin-top: 20px;
            font-size: 12px;
            color: #bdc3c7;
        }
    </style>
</head>
<body>

    <div class="card" id="form-state">
        <h2>Leave a note for Your Name</h2> <!-- CHANGE THIS TO YOUR NAME -->
        <p class="subtitle">As I move on to my next chapter, I'd love to hear your honest thoughts.</p>

        <form id="feedbackForm">
            <div class="form-group">
                <label>How would you rate our time working together?</label>
            </div>

            <div class="star-group">
                <div class="stars">
                    <input type="radio" id="star5" name="rating" value="5" required><label for="star5" title="Amazing">★</label>
                    <input type="radio" id="star4" name="rating" value="4"><label for="star4" title="Great">★</label>
                    <input type="radio" id="star3" name="rating" value="3"><label for="star3" title="Good">★</label>
                    <input type="radio" id="star2" name="rating" value="2"><label for="star2" title="Fair">★</label>
                    <input type="radio" id="star1" name="rating" value="1"><label for="star1" title="Poor">★</label>
                </div>
            </div>

            <div class="form-group">
                <label>Any memories, feedback, or well wishes?</label>
                <textarea id="comment" rows="4" placeholder="What will you remember most? What could I have done better?" required></textarea>
            </div>

            <div class="optional-name">
                <label style="font-weight: normal; cursor: pointer;">
                    <input type="checkbox" id="revealName" style="display:inline; width:auto; margin-right:5px;">
                    Share my name (Your feedback is completely anonymous by default)
                </label>
                <input type="text" id="name" placeholder="Your name">
            </div>

            <button type="submit">Send Farewell Note</button>
        </form>
        <div class="privacy-note">🔒 This runs entirely on my local machine. No data is sent to the internet.</div>
    </div>

    <div class="card" id="success-state">
        <div class="success-icon">🙌</div>
        <div class="success-text">Thank you so much!</div>
        <p style="color: #7f8c8d; margin-top: 10px;">I really appreciate you taking the time to write this. It means a lot to me.</p>
    </div>

    <script>
        // Toggle name field visibility
        document.getElementById('revealName').addEventListener('change', function() {
            const nameInput = document.getElementById('name');
            nameInput.style.display = this.checked ? 'block' : 'none';
            if (!this.checked) nameInput.value = '';
        });

        document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const isAnonymous = !document.getElementById('revealName').checked;
            const data = {
                name: isAnonymous ? "Anonymous" : document.getElementById('name').value,
                rating: parseInt(document.querySelector('input[name="rating"]:checked').value),
                comment: document.getElementById('comment').value
            };

            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    // Hide form, show success message
                    document.getElementById('form-state').style.display = 'none';
                    document.getElementById('success-state').style.display = 'block';
                } else {
                    alert("Oops! Something went wrong. Please try again.");
                }
            } catch (err) {
                alert("Network error. Please make sure you are on the company network.");
            }
        });
    </script>
</body>
</html>
"""


# --- 3. ROUTES ---

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    return HTML_TEMPLATE


@app.post("/api/feedback")
async def submit_feedback(feedback: FeedbackInput):
    try:
        try:
            with open(FEEDBACK_FILE, "r") as f:
                data = json.load(f)
        except FileNotFoundError:
            data = []

        data.append(feedback.model_dump())

        with open(FEEDBACK_FILE, "w") as f:
            json.dump(data, f, indent=4)

        return {"status": "success"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    print("Starting Farewell Feedback App...")
    print("Share this link with your peers: http://<YOUR-IP-ADDRESS>:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)