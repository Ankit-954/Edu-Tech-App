import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import "./reviewPage.css";

const ReviewPage = () => {
  const [reviews, setReviews] = useState([]); // State to store reviews
  const [name, setName] = useState(""); // State for user name
  const [comment, setComment] = useState(""); // State for user comment
  const [rating, setRating] = useState(1); // State for user rating

  const server = "http://localhost:5000"; // Define the server variable

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent form reload
    if (name && comment && rating) {
      const newReview = { name, comment, rating };

      try {
        const response = await fetch(`${server}/api/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newReview),
        });
        const data = await response.json();

        if (response.ok) {
          // Update reviews state with new review
          setReviews([...reviews, data]);
        }
      } catch (error) {
        console.error("Error submitting review:", error);
      }
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        className={index < rating ? "star-filled" : "star-empty"}
        onClick={() => setRating(index + 1)}
      />
    ));
  };

  const renderStarsForReview = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FontAwesomeIcon
        key={index}
        icon={faStar}
        className={index < rating ? "star-filled" : "star-empty"}
      />
    ));
  };

  return (
    <div className="review-page-container">
      {/* Left Section */}
      <div className="review-form-container">
        <h1>Leave a Review</h1>
        <form onSubmit={handleSubmit} className="review-form">
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Write your review or comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
          ></textarea>
          <div className="rating-stars">{renderStars()}</div>
          <button type="submit" className="submit-btn">Submit</button>
        </form>
      </div>

      {/* Right Section */}
      <div className="reviews-list-container">
        <h2>What others say:</h2>
        {reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div key={index} className="review-item">
              <h3>{review.name}</h3>
              <p>{review.comment}</p>
              <div className="rating-stars">
                {renderStarsForReview(review.rating)}
              </div>
            </div>
          ))
        ) : (
          <p>No reviews yet.</p>
        )}
      </div>
    </div>
  );
};

export default ReviewPage;
