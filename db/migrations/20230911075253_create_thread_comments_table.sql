-- migrate:up
CREATE TABLE thread_comments (
  id INT NOT NULL AUTO_INCREMENT,
  thread_id INT NOT NULL,
  user_id INT NOT NULL,
  content VARCHAR(2000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),          
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP, 
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE
);

-- migrate:down
DROP TABLE thread comments;
