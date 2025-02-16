crawler is done for now, now we need to build what a ocr:

![link](https://codingchallenges.fyi/challenges/challenge-ocr/)

<<<<<<< HEAD
done with a basic ocr in ts

done with json
need to define logic for crawler
=======
well, to get js content->
inspect webpage, move to sources,
will get a bunch of ts,js files

see we are done with json parser, ocr in typescript
need to work more on crawler

tried selenium crawler: 5-selenium
start a venv in it
```bash
# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

install dependencies-> `pip install selenium`
verify-> `python -c "import selenium; print(selenium.__version__)"`
to run it-> `python3 a.py https://google.com --output my_data`

what to do next: crawl photos, url-extraction
start a virtual env-> 
`python3 -m venv venv
source venv/bin/activate`
just install dependencies-> `pip install beautifulsoup4 requests`
on running it ask for a url to crawl and saves all type of images from a url to a specific folder
run cmd-> `python3 a.py`
