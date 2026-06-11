.PHONY: docker server frontend widgets

docker: server frontend widgets
	docker build . -t dm-manager

server:
	npm --prefix server ci --omit=dev

frontend:
	npm --prefix frontend ci --omit=dev
	npm --prefix frontend run build

widgets:
	npm --prefix widgets ci --omit=dev
	npm --prefix widgets run build
