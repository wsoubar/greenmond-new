"""Extrai conteúdo público sem alterar os arquivos legados. Não migra credenciais."""
from pathlib import Path
from html import unescape
import re, json, shutil, unicodedata
source = Path('old-versions/greenmond/www')
target = Path('src/data')
def text(value):
    value = re.sub(r'<br\s*/?>', '\n', value, flags=re.I)
    return unescape(re.sub('<[^>]+>', '', value)).strip()
def slug(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii','ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+','-',value).strip('-')
def save(name, data):
    (target / name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def cards(name):
    content=(source / f'templates/{name}.html').read_text()
    return re.split(r'<div class="(?:list card|card list)">',content)[1:]
for name in ['cidade','criacao']:
    result=[]
    for card in cards(name):
        title=re.search(r'item-divider[^>]*>\s*<p>(.*?)</p>',card,re.S).group(1)
        body=card.split('item-body',1)[1].split('>',1)[1]
        blocks=[]
        for match in re.finditer(r'<img\b[^>]*src="([^"]+)"[^>]*>|<(p|h3)\b[^>]*>(.*?)</\2>',body,re.S):
            if match.group(1): blocks.append({'type':'image','value':match.group(1).replace('./img/','images/')})
            else: blocks.append({'type':'heading' if match.group(2)=='h3' else 'text','value':text(match.group(3))})
        result.append({'id':slug(text(title)),'title':text(title),'blocks':blocks})
    save(name+'.json',result)
groups=[]
for card in cards('npcs'):
    title=text(re.search(r'<h2>(.*?)</h2>',card,re.S).group(1))
    image=re.search(r'<img[^>]*src="([^"]+)"',card).group(1).replace('./img/','images/')
    people=[]
    for item in re.findall(r'<li\b[^>]*>(.*?)</li>',card,re.S):
        name=text(re.search(r'<span[^>]*>(.*?)</span>',item,re.S).group(1))
        description=text(re.sub(r'<span[^>]*>.*?</span>','',item,count=1,flags=re.S))
        people.append({'id':slug(name),'name':name,'description':description})
    groups.append({'id':slug(title),'title':title,'image':image,'people':people})
save('npcs.json',groups)
# Histórias, jogadores e fichas aguardam decisão de visibilidade.
for folder in ['cidade','clanlogos']:
    shutil.copytree(source/'img'/folder,Path('public/images')/folder,dirs_exist_ok=True)
shutil.copy2(source/'img/ionic.png','public/images/ionic.png')
print('Migrados:',len(json.loads((target/'cidade.json').read_text())),'locais;',sum(len(x['people']) for x in groups),'NPCs;',len(json.loads((target/'criacao.json').read_text())),'seções de regras')
characters=json.loads((source/'personagens.json').read_text())
for character in characters:
    character.pop('senha',None)
    character['claImage']=character['claImage'].replace('./img/','images/')
save('personagens.json',characters)
sheets=[]
content=(source/'templates/planilha.html').read_text()
for match in re.finditer(r'ng-show="user.id == \'([^\']+)\'"(.*?)(?=ng-show="user.id|\Z)',content,re.S):
    paragraphs=re.findall(r'<p\b[^>]*>(.*?)</p>',match.group(2),re.S)
    sheets.append({'personagemId':match.group(1),'text':'\n\n'.join(text(p) for p in paragraphs if '{{' not in p)})
save('fichas.json',sheets)
