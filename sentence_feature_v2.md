# Sentence Generation Feature v2

Currently, the building of sentences is done by giving the vocabulary to LLM in the instructions and ask it to select random words to construct the sentence. 

The drawback of this method is that the LLMs are very bad for selecting random items from a list. However, if we pre-select randomly the subjects and nouns for a word, we can end up having weird sentences generated like "The cat carries the umbrella" or "The water drinks the man".

In this v2 of the Sentence Generation feature, we would like to pre-build the relations between words, so that we store which verbs can take which subjects and objects. In this way, we can randomly select from suitable subjects and objects, hence making the sentences have a better variety than before. 

Another benefit would also be, that we can select from new words, from words it has not learned too well, etc. Just like we do in the word quizes. 

For this we need to have a 2 tables: 
* Word table, with id, word, word_type. 
* Word relations table, with word id, relation type (subject, object), related word id

We need to cache these relations

Also need to convert other tables to use IDs
