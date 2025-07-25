Design & development of an user interface (frontend) and federation service (backend API)for federated search.

The objective of this development is to deliver a Github repository that helps people in setting up of a federative search based on open source software with a minimal dependency of developers. It should be easy to deploy (docker) for testing purposes and easy to deploy and adapt into an existing infrastructure.

The project is split into 3 phases.

-lexical search - purely on words entered
-enriched lexical search with support of AI/LLM for enriching the search with synonyms ad suggestions.
-semantical search

Please see this table to understand the differences between lexical and semantical search.


The federation service API gets search requests and return results that conform to an information model. We will use the DCAT standard in the first prototype. This service also allows for querying endpoints that support federation. The service dos not federate in its own. It just passes the query to the endpoint, gets the results, maps this to the information model and return this as a response.
