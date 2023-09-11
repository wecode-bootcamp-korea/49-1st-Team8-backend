-- migrate:up
CREATE TABLE thread_likes (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  thread_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),           
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE
);

-- migrate:down
DROP TABLE thread likes;
