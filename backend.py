from flask import Flask
from flask import request
from flask import redirect
from flask import url_for
app = Flask(__name__)

@app.route('/', methods=['GET','POST'])
def main():
    if request.method == 'GET':
        return redirect(url_for('static', filename='index.html'))
    elif request.method == 'POST':
        f = request.files['upload_file']

@app.route('/generate', methods=['POST'])
def generate():
    data = request.json
    print data
    return ''
        
if __name__ == '__main__':
    app.debug = True
    app.run()