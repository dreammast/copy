# Agent Testing Interface

This is a Streamlit-based interface for testing the various agents in the system. It provides a user-friendly way to interact with the Order Agent, Recommendation Agent, and Conversation Agent.

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the root directory with your API keys:
```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Running the Interface

To start the Streamlit interface, run:
```bash
streamlit run app.py
```

The interface will open in your default web browser.

## Features

- Test different agents (Order, Recommendation, Conversation)
- Input text area for entering requests
- Example inputs for each agent type
- Raw response view
- Environment information display

## Agent Types

1. **Order Agent**: Handles printing and stationery orders
   - Example: "I need to print 50 pages of A4 size documents near Connaught Place, Delhi"

2. **Recommendation Agent**: Provides book recommendations
   - Example: "I'm looking for mystery novels by Agatha Christie"

3. **Conversation Agent**: General conversation and assistance
   - Example: "Can you help me find a good book to read?"

## Troubleshooting

If you encounter any issues:
1. Ensure all API keys are properly set in the `.env` file
2. Check that all dependencies are installed correctly
3. Verify that the Python path includes the project root directory 