INSERT OR IGNORE INTO books (id, slug, title, author, published) VALUES ('alice','alices-adventures-in-wonderland','Alice''s Adventures in Wonderland','Lewis Carroll',1);
INSERT OR IGNORE INTO chapters VALUES ('alice',1,1,'Down the Rabbit-Hole'),('alice',1,2,'The Pool of Tears');
INSERT OR IGNORE INTO characters VALUES ('alice-character','alice','alice','Alice',1,1),('white-rabbit','alice','white-rabbit','The White Rabbit',1,1);
INSERT OR IGNORE INTO descriptions VALUES ('alice-1','alice-character',1,1,'A curious girl who follows a remarkable rabbit.'),('rabbit-1','white-rabbit',1,1,'A hurried white rabbit who carries a watch.');
INSERT OR IGNORE INTO relations VALUES ('alice-rabbit','alice','alice-character','white-rabbit',1,1,'Follows');
INSERT OR IGNORE INTO events VALUES ('rabbit-hole','alice',1,1,'Down the rabbit-hole','Alice follows the White Rabbit into a curious new world.');
INSERT OR IGNORE INTO characters VALUES ('mouse','alice','mouse','The Mouse',1,2);
INSERT OR IGNORE INTO descriptions VALUES ('mouse-2','mouse',1,2,'A mouse whom Alice meets in the pool.');
