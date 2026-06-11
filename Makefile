.PHONY: docker server frontend widgets

docker: server frontend widgets
	docker build . -t dm-manager

server: frontend widgets
	npm --prefix server ci --omit=dev
	cp -dprv frontend/public/* ./server/public/
	mkdir -p server/public/static
	cp -dprv widgets/public/dmwidgets.js server/public/static

frontend:
	npm --prefix frontend ci --omit=dev
	npm --prefix frontend run build

widgets:
	npm --prefix widgets ci --omit=dev
	npm --prefix widgets run build

clean:
	rm -rf server/public/font
	rm -f server/public/index.html
	rm -rf server/public/static
