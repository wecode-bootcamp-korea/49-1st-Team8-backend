-- migrate:up
CREATE TABLE threads (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  content VARCHAR(2000) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),           
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP, 
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- migrate:down
DROP TABLE threads;