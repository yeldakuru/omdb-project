## !!!
### Live Deployment
I hosted the backend on Render's free tier. Due to the cold start nature of free instances, the initial request might take a few seconds to wake up the server. However, I’ve optimized the performance by implementing a server-side caching system to ensure that once it's up, subsequent data retrieval is highly efficient.
The backend service is [Live on Render](https://omdb-project-j6ae.onrender.com).
Frontend [GitHub Pages deployment](https://yeldakuru.github.io/omdb-project/)

## Installed Packages
`npm init -y`
* **express**: Web framework to handle routing. 
* **cors**: Middleware to allow requests from the frontend. 
* `npm i express cors axios`
* **axios**: To make HTTP requests to the OMDB API.
* **dotenv**: To securely manage the API Key using environment variables.
`npm i dotenv` 


##  Key Features
* **Deployed on Render:** The backend is hosted and running live on the Render platform.
* **Secure Proxy:** The OMDB API Key is hidden on the server-side for security.
* **In-Memory Caching:** Stores previous search results in an object. If the same movie is searched again, it returns the result from the cache instead of making a new API call.
* **Full Data Return:** Returns the complete search list (`Search` array) to the frontend.
* **Debounce Support:** Optimized to handle rapid input from the frontend search bar.

## Setup

1. Run `npm install`.
2. Create a `.env` file and add:  
   `API_KEY=your_key`  
   `PORT=5000`
3. Start the server with `npm start`.

