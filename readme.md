# Last Wish

A parimutuel betting experiment inspired by the Destiny 2 raid Last Wish. The application allows users to create bets and wager points on various outcomes, similar to the Twitch Predictions system.

## Features

- **User Authentication:** Sign up and login functionality with secure password hashing and point tracking.
- **Create Predictions:** Users can create new predictions with multiple outcomes.
- **Vote with Points:** Allocate points to outcomes when voting. Points are deducted from the user's balance upon voting.
- **Parimutuel Betting:** Points are redistributed to winners based on the total points wagered on losing outcomes.
- **Admin Panel:** Admin users can allocate points to users and resolve expired predictions.
- **View Expired Predictions:** See past predictions and resolve them to distribute points accordingly.
- **Responsive Design:** Optimized for various screen sizes using CSS Flexbox and media queries.
- **Toast Notifications:** Real-time feedback for user actions like signup, login, voting, and point allocation.

## Points System

- **Initial Points:** Each user starts with **1000 points**.
- **Voting:** Users allocate points to their chosen outcome(s) in a prediction.
- **Point Deduction:** Allocated points are deducted from the user's balance upon voting.
- **Point Redistribution:** Upon prediction resolution, points from losing outcomes are distributed equally among the unique users who voted for the winning outcome.

## Installation and Setup

### Prerequisites

- **Node.js:** Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Steps

1. **Clone the Repository:**
    ```bash
    git clone https://github.com/yourusername/lastwish.git
    cd lastwish
    ```

2. **Install Dependencies:**
    ```bash
    npm install
    ```

3. **Create `db.json`:**
    Create a file named `db.json` in the project root with the following initial structure:
    ```json
    {
      "users": [],
      "predictions": []
    }
    ```

4. **Start the Server:**
    ```bash
    node server.js
    ```

5. **Access the Application:**
    Open your browser and navigate to `http://localhost:3000`.

## Usage

1. **Sign Up:**
    - Navigate to the Sign-Up page.
    - Create a new account by providing a username and password.
    - Each new user starts with **1000 points**.

2. **Login:**
    - Log in with your credentials to access the home page.

3. **Create a Prediction:**
    - Enter a prediction description.
    - Set the expiration time in minutes.
    - Specify at least two outcomes for the prediction.

4. **Vote on Predictions:**
    - Allocate points to your chosen outcome(s).
    - Points are deducted from your balance upon voting.

5. **View and Resolve Expired Predictions:**
    - Navigate to the Expired Predictions page to view past predictions.
    - Admin users can resolve predictions to redistribute points based on the winning outcome.

6. **Admin Panel:**
    - Admin users can allocate points to other users.
    - Resolve expired predictions to distribute points equally among unique winners.

## Admin Features

- **Allocate Points:**
    - Admins can manually allocate points to any user.
    - Useful for rewarding users or adjusting balances.

- **Resolve Predictions:**
    - Admins can resolve expired predictions by specifying the winning outcome.
    - Points from losing outcomes are equally distributed among unique users who voted for the winning outcome.

## Security Considerations

- **Password Hashing:** User passwords are hashed using `bcrypt` to ensure security.
- **Session Management:** Utilizes `localStorage` to store the logged-in username and role. For a production environment, consider implementing more secure session management mechanisms.
- **Input Validation:** All inputs are validated on the server-side to prevent malicious data entry.

## Data Persistence

- **Database:** This implementation uses a JSON file (`db.json`) for data storage, suitable for development and testing purposes.
- **Scalability:** For production environments, consider migrating to a robust database system like PostgreSQL or MongoDB to handle larger datasets and concurrent operations.

## Point Redistribution Logic

Upon resolving a prediction, points from all outcomes are totaled and redistributed equally among the unique users who voted for the winning outcome. This ensures fair distribution where each winner receives an equal share of the pooled points from losing bets.

**Example:**
- **Total Points from All Outcomes:** 1000 points
- **Number of Unique Winners:** 5 users
- **Points Distributed to Each Winner:** 1000 / 5 = 200 points

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch:
    ```bash
    git checkout -b feature/YourFeature
    ```
3. Commit your changes:
    ```bash
    git commit -m "Add your message here"
    ```
4. Push to the branch:
    ```bash
    git push origin feature/YourFeature
    ```
5. Open a pull request describing your changes.

## License

This project is licensed under the [Unlicense](LICENSE).

## Acknowledgements

Inspired by the Destiny 2 raid Last Wish and the Twitch Predictions system.

---
