Design & development of an user interface (frontend) and federation service (backend API)for federated search.

The objective of this development is to deliver a Github repository that helps people in setting up of a federative search based on open source software with a minimal dependency of developers. It should be easy to deploy (docker) for testing purposes and easy to deploy and adapt into an existing infrastructure.

The project is split into 3 phases.

- lexical search - purely on words entered
- enriched lexical search with support of AI/LLM for enriching the search with synonyms ad suggestions.
- semantical search 

Please see this table to understand the differences between lexical and semantical search.

<img width="903" height="217" alt="image" src="https://github.com/user-attachments/assets/2032a868-ef46-4a13-ab49-51af14293c76" />

The federation service API gets search requests and return results that conform to an information model. We will use the DCAT standard in the first prototype. This service also allows for querying endpoints that support federation. It just passes the query to the endpoint, gets the results, maps this to the information model and return this as a response.

The service also federates in its own. One can query multiple endpoints and once. The service combines the results. 

<img width="1240" height="748" alt="federated search diagram" src="https://github.com/user-attachments/assets/dbc60e64-f5b1-4f57-9ee4-cfe270b65719" />
