// Logic for handling the search bar requests
export const handleTextSearch = async (req, res) => {
    // Create an AbortController tied to this request
    const abortController = new AbortController();

    // If the client disconnects (closes tab/window), abort all ongoing work
    req.on('close', () => {
        abortController.abort();
    });

    try {
        // TODO: Implement the actual search logic here
        // Pass abortController.signal to any fetch() or long-running operation, e.g.:
        // const result = await fetch('https://api.example.com/search', {
        //     signal: abortController.signal
        // });

        // Guard: don't send a response if the client already disconnected
        if (abortController.signal.aborted) return;

        res.status(200).json({ message: "Search bar logic is ready to be implemented!" });
    } catch (error) {
        // If the error is because the client disconnected, just log and exit
        if (error.name === 'AbortError') {
            console.log('Text search request aborted by client');
            return;
        }
        console.error('Error in text search:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

// Logic for handling the voice chat/search requests
export const handleVoiceSearch = async (req, res) => {
    // Create an AbortController tied to this request
    const abortController = new AbortController();

    // If the client disconnects (closes tab/window), abort all ongoing work
    req.on('close', () => {
        abortController.abort();
    });

    try {
        // TODO: Implement the actual voice logic here
        // Pass abortController.signal to any fetch() or long-running operation, e.g.:
        // const result = await fetch('https://api.example.com/voice', {
        //     signal: abortController.signal
        // });

        // Guard: don't send a response if the client already disconnected
        if (abortController.signal.aborted) return;

        res.status(200).json({ message: "Voice chat logic is ready to be implemented!" });
    } catch (error) {
        // If the error is because the client disconnected, just log and exit
        if (error.name === 'AbortError') {
            console.log('Voice search request aborted by client');
            return;
        }
        console.error('Error in voice search:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
