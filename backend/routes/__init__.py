from .ocr import bp as grid_segmentation_bp
from .refined_ocr_text import bp as refined_ocr_text_bp
def register_blueprints(app):
    app.register_blueprint(grid_segmentation_bp)
    app.register_blueprint(refined_ocr_text_bp)